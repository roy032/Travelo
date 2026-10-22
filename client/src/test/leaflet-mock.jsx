// Lightweight stand-ins for react-leaflet: jsdom has no layout, so tests
// check what is drawn (markers, routes) rather than real map tiles.
export const reactLeafletMock = () => ({
  MapContainer: ({ children }) => <div data-testid='map'>{children}</div>,
  TileLayer: () => null,
  Marker: ({ title, children }) => (
    <div data-testid='marker' title={title}>
      {children}
    </div>
  ),
  Popup: ({ children }) => <div>{children}</div>,
  Polyline: ({ positions }) => (
    <div data-testid='route' data-points={positions.length} />
  ),
});
