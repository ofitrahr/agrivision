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
    def generate_manager_map(farm_boundary_geojson=None, existing_blocks_geojson=None, thumbnail=False):
        m = folium.Map(
            location=[-0.7893, 113.9213], 
            zoom_start=5, 
            max_zoom=22, 
            tiles="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", 
            attr="Google",  
            zoom_control= False,
        )
        
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

        if not thumbnail:
            draw = Draw(
                draw_options={
                    'polyline': False,
                    'rectangle': False,
                    'circle': False,
                    'circlemarker': False,
                    'marker': False,
                    'polygon': False
                },
                edit_options={'edit': False, 'remove': False}
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
        else:
            m.get_root().html.add_child(folium.Element("<style>.leaflet-control-attribution { display: none !important; }</style>"))

        return m.get_root().render()

    @staticmethod
    def generate_agronomy_map(farm_boundary_geojson=None, existing_blocks_geojson=None, layer_type='ndvi', has_access=False):
        m = folium.Map(location=[-0.7893, 113.9213], zoom_start=5, max_zoom=22, tiles="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", attr="Google")
        
        if farm_boundary_geojson:
            import random
            
            if layer_type == 'soc':
                value = round(random.uniform(20.0, 80.0), 1)
                if has_access:
                    color = '#8b5a2b' if value > 50 else ('#cd853f' if value > 30 else '#deb887')
                    popup_html = f"<b>Kandungan SOC:</b> {value} ton/ha<br>{'Tinggi' if value > 50 else ('Sedang' if value > 30 else 'Rendah')}"
                else:
                    color = 'gray'
                    popup_html = f"<i>Langganan Modul SOC diperlukan untuk melihat kandungan karbon organik tanah.</i>"
            elif layer_type == 'biomass':
                value = round(random.uniform(50.0, 250.0), 1)
                if has_access:
                    color = '#228b22' if value > 150 else ('#32cd32' if value > 80 else '#90ee90')
                    popup_html = f"<b>Estimasi Biomassa:</b> {value} ton/ha<br>{'Tinggi' if value > 150 else ('Sedang' if value > 80 else 'Rendah')}"
                else:
                    color = 'gray'
                    popup_html = f"<i>Langganan Modul Biomassa diperlukan untuk melihat estimasi biomassa karbon.</i>"
            elif layer_type == 'yield':
                value = round(random.uniform(0.8, 3.5), 2)
                if has_access:
                    color = '#feb24c' if value > 2.0 else ('#f03b20' if value > 1.2 else '#ffeda0')
                    popup_html = f"<b>Estimasi Produksi (Yield):</b> {value} Ton/Ha"
                else:
                    color = 'gray'
                    popup_html = f"<i>Langganan Modul Yield diperlukan.</i>"
            elif layer_type == 'soilnpk':
                value = round(random.uniform(60.0, 280.0), 1)
                if has_access:
                    color = '#1c9099' if value > 180 else ('#a6bddb' if value > 100 else '#ece2f0')
                    popup_html = f"<b>Nutrisi Tanah (NPK):</b> {value} kg NPK/Ha"
                else:
                    color = 'gray'
                    popup_html = f"<i>Langganan Modul Nutrisi NPK diperlukan.</i>"
            else: # ndvi
                value = round(random.uniform(0.4, 0.9), 2)
                if has_access:
                    color = '#10b981' if value > 0.7 else ('#f59e0b' if value > 0.5 else '#ef4444')
                    popup_html = f"<b>Score NDVI:</b> {value}<br>{'Sehat' if value > 0.7 else 'Waspada'}"
                else:
                    color = 'gray'
                    popup_html = f"<i>Langganan Modul NDVI diperlukan untuk melihat tingkat kesehatan tanaman.</i>"

            bounds_layer = folium.GeoJson(
                farm_boundary_geojson,
                style_function=lambda x, c=color: {'color': c, 'fillColor': c, 'weight': 3, 'fillOpacity': 0.6},
                tooltip=popup_html
            )
            bounds_layer.add_to(m)
            m.fit_bounds(bounds_layer.get_bounds())

        return m.get_root().render()