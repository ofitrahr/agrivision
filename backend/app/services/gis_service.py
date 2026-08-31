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
            tiles="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", 
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
    def _get_color_for_value(value, layer_type):
        if layer_type == 'ndvi':
            if value > 0.7:
                return '#10b981'
            elif value > 0.4:
                return '#f59e0b'
            return '#ef4444'
        elif layer_type == 'soc':
            if value > 50:
                return '#8b5a2b'
            elif value > 30:
                return '#cd853f'
            return '#deb887'
        elif layer_type == 'biomass':
            if value > 150:
                return '#228b22'
            elif value > 80:
                return '#32cd32'
            return '#90ee90'
        elif layer_type == 'yield':
            if value > 2.0:
                return '#feb24c'
            elif value > 1.2:
                return '#f03b20'
            return '#ffeda0'
        elif layer_type == 'nitrogen':
            if value > 40: return '#1c9099'
            elif value > 20: return '#a6bddb'
            return '#ece2f0'
        elif layer_type == 'phosphorus':
            if value > 20: return '#1c9099'
            elif value > 10: return '#a6bddb'
            return '#ece2f0'
        elif layer_type == 'potassium':
            if value > 45: return '#1c9099'
            elif value > 30: return '#a6bddb'
            return '#ece2f0'
        elif layer_type == 'soilnpk':
            if value > 180: return '#1c9099'
            elif value > 100: return '#a6bddb'
            return '#ece2f0'
        return '#6b7280'

    @staticmethod
    def _build_legend_html(layer_type):
        legends = {
            'ndvi': [('#10b981', 'Sehat (>0.7)'), ('#f59e0b', 'Waspada (0.4-0.7)'), ('#ef4444', 'Kritis (<0.4)')],
            'soc': [('#8b5a2b', 'Tinggi (>50)'), ('#cd853f', 'Sedang (30-50)'), ('#deb887', 'Rendah (<30)')],
            'biomass': [('#228b22', 'Tinggi (>150)'), ('#32cd32', 'Sedang (80-150)'), ('#90ee90', 'Rendah (<80)')],
            'yield': [('#feb24c', 'Tinggi (>2.0)'), ('#f03b20', 'Sedang (1.2-2.0)'), ('#ffeda0', 'Rendah (<1.2)')],
            'soilnpk': [('#1c9099', 'Tinggi (>180)'), ('#a6bddb', 'Sedang (100-180)'), ('#ece2f0', 'Rendah (<100)')],
            'nitrogen': [('#1c9099', 'Tinggi (>40)'), ('#a6bddb', 'Sedang (20-40)'), ('#ece2f0', 'Rendah (<20)')],
            'phosphorus': [('#1c9099', 'Tinggi (>20)'), ('#a6bddb', 'Sedang (10-20)'), ('#ece2f0', 'Rendah (<10)')],
            'potassium': [('#1c9099', 'Tinggi (>45)'), ('#a6bddb', 'Sedang (30-45)'), ('#ece2f0', 'Rendah (<30)')],
        }
        items = legends.get(layer_type, [])
        rows_html = ''.join(
            f'<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">'
            f'<div style="width:14px;height:14px;border-radius:50%;background:{color};flex-shrink:0;"></div>'
            f'<span style="font-size:11px;color:#374151;">{label}</span></div>'
            for color, label in items
        )
        return (
            f'<div style="position:absolute;bottom:30px;left:10px;z-index:1000;'
            f'background:rgba(255,255,255,0.92);border:1px solid #d1fae5;border-radius:8px;'
            f'padding:10px 14px;box-shadow:0 2px 8px rgba(0,0,0,0.1);font-family:sans-serif;">'
            f'<div style="font-size:11px;font-weight:600;color:#116a3a;margin-bottom:6px;">'
            f'{layer_type.upper()} Legend</div>'
            f'{rows_html}</div>'
        )

    @staticmethod
    def generate_agronomy_map(farm_boundary_geojson=None, existing_blocks_geojson=None, layer_type='ndvi', has_access=False, sample_points=None):
        m = folium.Map(location=[-0.7893, 113.9213], zoom_start=5, max_zoom=22, tiles="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", attr="Google")

        if farm_boundary_geojson:
            bounds_layer = folium.GeoJson(
                farm_boundary_geojson,
                style_function=lambda x: {'color': 'yellow', 'fillColor': 'transparent', 'weight': 3}
            )
            bounds_layer.add_to(m)
            m.fit_bounds(bounds_layer.get_bounds())

        if has_access:
            if sample_points:
                from folium.plugins import HeatMap
                heat_data = [[point['lat'], point['lon'], float(point['value'])] for point in sample_points]
                
                gradients = {
                    'ndvi': {0.4: '#ef4444', 0.65: '#f59e0b', 1.0: '#10b981'},
                    'soc': {0.3: '#deb887', 0.6: '#cd853f', 1.0: '#8b5a2b'},
                    'biomass': {0.4: '#90ee90', 0.7: '#32cd32', 1.0: '#228b22'},
                    'yield': {0.4: '#ffeda0', 0.7: '#f03b20', 1.0: '#feb24c'},
                    'soilnpk': {0.4: '#ece2f0', 0.7: '#a6bddb', 1.0: '#1c9099'},
                    'nitrogen': {0.4: '#ece2f0', 0.7: '#a6bddb', 1.0: '#1c9099'},
                    'phosphorus': {0.4: '#ece2f0', 0.7: '#a6bddb', 1.0: '#1c9099'},
                    'potassium': {0.4: '#ece2f0', 0.7: '#a6bddb', 1.0: '#1c9099'},
                }
                gradient = gradients.get(layer_type, {0.4: 'blue', 0.65: 'lime', 1.0: 'red'})
                
                HeatMap(
                    heat_data,
                    min_opacity=0.4,
                    radius=25,
                    blur=15,
                    gradient=gradient
                ).add_to(m)

                for point in sample_points:
                    folium.CircleMarker(
                        location=[point['lat'], point['lon']],
                        radius=15,
                        weight=0,
                        color='transparent',
                        fill=True,
                        fill_color='transparent',
                        fill_opacity=0,
                        opacity=0,
                        tooltip=f"<b>{layer_type.upper()}:</b> {point['value']}"
                    ).add_to(m)
            else:
                import random
                if farm_boundary_geojson:
                    if layer_type == 'soc':
                        value = round(random.uniform(20.0, 80.0), 1)
                        color = GISService._get_color_for_value(value, layer_type)
                        popup_html = f"<b>Kandungan SOC:</b> {value} ton/ha"
                    elif layer_type == 'biomass':
                        value = round(random.uniform(50.0, 250.0), 1)
                        color = GISService._get_color_for_value(value, layer_type)
                        popup_html = f"<b>Estimasi Biomassa:</b> {value} ton/ha"
                    elif layer_type == 'yield':
                        value = round(random.uniform(0.8, 3.5), 2)
                        color = GISService._get_color_for_value(value, layer_type)
                        popup_html = f"<b>Estimasi Produksi (Yield):</b> {value} Ton/Ha"
                    elif layer_type == 'soilnpk':
                        value = round(random.uniform(60.0, 280.0), 1)
                        color = GISService._get_color_for_value(value, layer_type)
                        popup_html = f"<b>Nutrisi Tanah (NPK):</b> {value} kg NPK/Ha"
                    elif layer_type == 'nitrogen':
                        value = round(random.uniform(10.0, 50.0), 1)
                        color = GISService._get_color_for_value(value, layer_type)
                        popup_html = f"<b>Nitrogen (N):</b> {value} kg/Ha"
                    elif layer_type == 'phosphorus':
                        value = round(random.uniform(5.0, 30.0), 1)
                        color = GISService._get_color_for_value(value, layer_type)
                        popup_html = f"<b>Fosfor (P):</b> {value} kg/Ha"
                    elif layer_type == 'potassium':
                        value = round(random.uniform(20.0, 60.0), 1)
                        color = GISService._get_color_for_value(value, layer_type)
                        popup_html = f"<b>Kalium (K):</b> {value} kg/Ha"
                    else:
                        value = round(random.uniform(0.4, 0.9), 2)
                        color = GISService._get_color_for_value(value, layer_type)
                        popup_html = f"<b>Score NDVI:</b> {value}"

                    folium.GeoJson(
                        farm_boundary_geojson,
                        style_function=lambda x, c=color: {'color': c, 'fillColor': c, 'weight': 3, 'fillOpacity': 0.6},
                        tooltip=popup_html
                    ).add_to(m)
        elif farm_boundary_geojson:
            label_map = {
                'soc': 'Modul SOC', 'biomass': 'Modul Biomassa',
                'yield': 'Modul Yield', 'soilnpk': 'Modul Nutrisi NPK', 'ndvi': 'Modul NDVI'
            }
            popup_html = f"<i>Langganan {label_map.get(layer_type, 'Modul Agronomi')} diperlukan.</i>"
            folium.GeoJson(
                farm_boundary_geojson,
                style_function=lambda x: {'color': 'gray', 'fillColor': 'gray', 'weight': 3, 'fillOpacity': 0.4},
                tooltip=popup_html
            ).add_to(m)

        m.get_root().html.add_child(folium.Element("<style>.leaflet-control-attribution { display: none !important; }</style>"))

        if has_access:
            legend_html = GISService._build_legend_html(layer_type)
            m.get_root().html.add_child(folium.Element(legend_html))

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
                    window.addEventListener('message', function(event) {
                        if (event.data && event.data.type === 'SET_LAYER_OPACITY') {
                            var targetOpacity = event.data.opacity / 100;
                            mapInstance.eachLayer(function(layer) {
                                if (layer.setStyle && typeof layer.setStyle === 'function') {
                                    layer.setStyle({
                                        fillOpacity: targetOpacity * 0.7,
                                        opacity: targetOpacity
                                    });
                                }
                            });
                        }
                    });
                }
            }, 500);
        </script>
        """
        m.get_root().html.add_child(folium.Element(js_code))

        return m.get_root().render()