import folium
from folium.plugins import Draw

class GISService:
    @staticmethod
    def generate_global_map():
        m = folium.Map(location=[-0.7893, 113.9213], zoom_start=5, max_zoom=22, tiles="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", attr="Google")
        
        draw = Draw(
            draw_options={
                'polyline': False,
                'rectangle': False,
                'circle': False,
                'circlemarker': False,
                'marker': False,
                'polygon': True
            },
            edit_options={'edit': False}
        )
        m.add_child(draw)

        m.get_root().html.add_child(folium.Element("<style>.leaflet-control-attribution { display: none !important; }</style>"))
        js_code = """
        <script>
            setTimeout(function() {
                var mapInstance = null;
                for (var key in window) {
                    if (key.startsWith('map_')) {
                        mapInstance = window[key];
                        break;
                    }
                }
                
                if (mapInstance) {
                    mapInstance.on('draw:created', function(e) {
                        var layer = e.layer;
                        var geojson = layer.toGeoJSON();
                        
                        window.parent.postMessage({
                            type: 'GIS_DRAW_CREATED',
                            geometry: geojson.geometry
                        }, '*');
                        
                        mapInstance.addLayer(layer);
                    });
                }
            }, 1000);
        </script>
        """ 
        m.get_root().html.add_child(folium.Element(js_code))

        return m.get_root().render()

    @staticmethod
    def generate_manager_map(farm_boundary_geojson=None, existing_blocks_geojson=None):
        m = folium.Map(location=[-0.7893, 113.9213], zoom_start=5, max_zoom=22, tiles="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", attr="Google")
        
        if farm_boundary_geojson:
            bounds_layer = folium.GeoJson(
                farm_boundary_geojson,
                style_function=lambda x: {'color': 'yellow', 'fillColor': 'transparent', 'weight': 3}
            )
            bounds_layer.add_to(m)
            m.fit_bounds(bounds_layer.get_bounds())

        if existing_blocks_geojson:
            for block in existing_blocks_geojson:
                folium.GeoJson(
                    block['polygon'],
                    style_function=lambda x: {'color': 'green', 'fillColor': 'green', 'weight': 2, 'fillOpacity': 0.3},
                    tooltip=block.get('name', 'Blok Lahan')
                ).add_to(m)

        draw = Draw(
            draw_options={
                'polyline': False,
                'rectangle': False,
                'circle': False,
                'circlemarker': False,
                'marker': False,
                'polygon': True
            },
            edit_options={'edit': False}
        )
        m.add_child(draw)

        m.get_root().html.add_child(folium.Element("<style>.leaflet-control-attribution { display: none !important; }</style>"))
        js_code = """
        <script>
            setTimeout(function() {
                var mapInstance = null;
                for (var key in window) {
                    if (key.startsWith('map_')) {
                        mapInstance = window[key];
                        break;
                    }
                }
                
                if (mapInstance) {
                    mapInstance.on('draw:created', function(e) {
                        var layer = e.layer;
                        var geojson = layer.toGeoJSON();
                        
                        window.parent.postMessage({
                            type: 'GIS_DRAW_CREATED',
                            geometry: geojson.geometry
                        }, '*');
                        
                        mapInstance.addLayer(layer);
                    });
                }
            }, 1000);
        </script>
        """ 
        m.get_root().html.add_child(folium.Element(js_code))

        return m.get_root().render()