import { useEffect, useRef, useState } from 'react';
import { LngLatBounds, Map as MapboxMap, Marker, NavigationControl } from 'mapbox-gl/esm';
import 'mapbox-gl/mapbox-gl.css';
import { MAPBOX_STYLE, RELIEF_POINT_TYPE_LABELS } from '@heatshift/shared';
import { DEMO_LOCATION } from '../../lib/constants';
import { formatDistanceKm } from '../../lib/utils';
import {
  createReliefMarkerElement,
  createUserMarkerElement,
  styleReliefMarker,
} from './relief-marker';
import type { NearbyReliefPoint } from './use-relief-points';
import type { Coordinates } from '../../hooks/use-location';

/**
 * The only file that touches mapbox-gl, which makes it the only thing the relief
 * route lazy-loads.
 *
 * Selection is mirrored through props: clicking a marker updates the page, and
 * picking a list item enlarges and rings that marker. The point's details appear
 * in the panel beside the map rather than in a Mapbox popup, because a popup is
 * floating markup a keyboard or screen-reader user reaches only by luck.
 */

/** Public, domain-restricted browser token; Vite inlines it at build time. */
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN?.trim() ?? '';

const FIT_PADDING = 36;
/** Past this the whole city fits and the markers turn into a blob. */
const MAX_FIT_ZOOM = 14;
const HOME_CENTER: [number, number] = [DEMO_LOCATION.lng, DEMO_LOCATION.lat];

function markerLabel(point: NearbyReliefPoint): string {
  return [
    point.name,
    RELIEF_POINT_TYPE_LABELS[point.type],
    `${formatDistanceKm(point.distanceKm)} away`,
    point.verified ? 'field verified' : 'needs verification',
  ].join('. ');
}

export type ReliefMapProps = {
  points: NearbyReliefPoint[];
  selectedId: string | null;
  origin: Coordinates;
  /** Only a position the browser actually granted earns a "you are here" dot. */
  hasDeviceLocation: boolean;
  onSelect: (point: NearbyReliefPoint) => void;
  /** Mapbox could not render - the caller swaps in the list-only fallback. */
  onError: (message: string) => void;
};

export default function ReliefMap({
  points,
  selectedId,
  origin,
  hasDeviceLocation,
  onSelect,
  onError,
}: ReliefMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markersRef = useRef(
    new Map<string, { marker: Marker; element: HTMLButtonElement }>(),
  );
  const userMarkerRef = useRef<Marker | null>(null);
  const pointsRef = useRef(points);
  const selectRef = useRef(onSelect);
  const errorRef = useRef(onError);
  const fittedKeyRef = useRef('');
  const [loaded, setLoaded] = useState(false);

  pointsRef.current = points;
  selectRef.current = onSelect;
  errorRef.current = onError;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let map: MapboxMap;
    try {
      map = new MapboxMap({
        container,
        accessToken: MAPBOX_ACCESS_TOKEN,
        style: MAPBOX_STYLE,
        center: HOME_CENTER,
        zoom: 11.5,
      });
    } catch (error) {
      // An unusable token is rejected here, before a single tile is requested.
      errorRef.current(
        error instanceof Error ? error.message : 'Mapbox failed to start.',
      );
      return;
    }

    mapRef.current = map;
    map.addControl(new NavigationControl({ visualizePitch: false }), 'top-right');
    let rendered = false;
    map.on('load', () => {
      rendered = true;
      // The camera may have been framed before the style existed; allow one refit.
      fittedKeyRef.current = '';
      setLoaded(true);
    });
    // Only a failure before the first frame is worth tearing the map down for:
    // after that, one dropped tile should not delete a working map.
    map.on('error', (event) => {
      if (rendered) return;
      errorRef.current(event.error?.message ?? 'The map style could not be loaded.');
    });

    const observer = new ResizeObserver(() => map.resize());
    observer.observe(container);

    return () => {
      observer.disconnect();
      if (mapRef.current === map) {
        for (const { marker } of markersRef.current.values()) marker.remove();
        markersRef.current.clear();
        userMarkerRef.current?.remove();
        userMarkerRef.current = null;
        mapRef.current = null;
        fittedKeyRef.current = '';
      }
      map.remove();
    };
  }, []);

  // Add, restyle and drop markers to match the visible points. Elements are
  // reused so a click from the keyboard keeps its focus.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const visible = new Set<string>();
    for (const point of points) {
      visible.add(point.id);
      const state = {
        type: point.type,
        verified: point.verified,
        label: markerLabel(point),
        selected: point.id === selectedId,
      };
      const position: [number, number] = [point.longitude, point.latitude];
      const existing = markersRef.current.get(point.id);

      if (existing) {
        styleReliefMarker(existing.element, state);
        existing.marker.setLngLat(position);
        continue;
      }

      const element = createReliefMarkerElement(state);
      element.addEventListener('click', () => {
        const current = pointsRef.current.find((candidate) => candidate.id === point.id);
        if (current) selectRef.current(current);
      });
      const marker = new Marker({ element, anchor: 'center' })
        .setLngLat(position)
        .addTo(map);
      markersRef.current.set(point.id, { marker, element });
    }

    for (const [id, entry] of markersRef.current) {
      if (visible.has(id)) continue;
      entry.marker.remove();
      markersRef.current.delete(id);
    }
  }, [points, selectedId, loaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!hasDeviceLocation) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      return;
    }

    const position: [number, number] = [origin.lng, origin.lat];
    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat(position);
      return;
    }
    userMarkerRef.current = new Marker({
      element: createUserMarkerElement(),
      anchor: 'center',
    })
      .setLngLat(position)
      .addTo(map);
  }, [hasDeviceLocation, origin.lat, origin.lng, loaded]);

  // Frame the data once per point-set or origin change, then leave the camera
  // alone so the worker's own pan and zoom survive filtering and re-renders.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const key = `${origin.lat.toFixed(3)},${origin.lng.toFixed(3)}|${points
      .map((point) => point.id)
      .join(',')}|${hasDeviceLocation}`;
    if (key === fittedKeyRef.current) return;
    fittedKeyRef.current = key;

    const bounds = new LngLatBounds();
    if (hasDeviceLocation) bounds.extend([origin.lng, origin.lat]);
    for (const point of points) bounds.extend([point.longitude, point.latitude]);

    if (bounds.isEmpty()) {
      map.setCenter(HOME_CENTER);
      map.setZoom(11.5);
      return;
    }
    map.fitBounds(bounds, { padding: FIT_PADDING, maxZoom: MAX_FIT_ZOOM });
  }, [points, origin.lat, origin.lng, hasDeviceLocation, loaded]);

  // Bring a list selection into view; the enlarged, ringed marker is the
  // highlight, and panning only happens when the point is genuinely off-screen.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;

    const point = points.find((candidate) => candidate.id === selectedId);
    if (!point) return;
    const lngLat = { lat: point.latitude, lng: point.longitude };
    const viewport = map.getBounds();
    if (viewport?.contains(lngLat)) return;
    map.panTo([point.longitude, point.latitude]);
  }, [selectedId, points, loaded]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      role="region"
      aria-label="Relief points on a map"
    />
  );
}
