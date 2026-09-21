import json

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
                style_function=lambda x: {'color': '#fdb134', 'fillColor': 'transparent', 'weight': 3}
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
            # Rentang riil model NPK Kadatuan: 0.45% - 0.86%
            if value > 0.75: return '#14532d'
            elif value > 0.55: return '#22c55e'
            return '#eab308'
        elif layer_type == 'phosphorus':
            # Rentang riil model NPK Kadatuan: 7 - 370 mg/kg
            if value > 150: return '#991b1b'
            elif value > 50: return '#ea580c'
            return '#fed7aa'
        elif layer_type == 'potassium':
            # Rentang riil model NPK Kadatuan: 115 - 165 mg/kg
            if value > 150: return '#4c1d95'
            elif value > 130: return '#8b5cf6'
            return '#93c5fd'
        elif layer_type == 'soilnpk':
            if value > 140: return '#065f46'
            elif value > 100: return '#0d9488'
            return '#99f6e4'
        return '#6b7280'

    @staticmethod
    def _build_legend_html(layer_type):
        legends = {
            'ndvi': [('#10b981', 'Sehat (>0.7)'), ('#f59e0b', 'Waspada (0.4-0.7)'), ('#ef4444', 'Kritis (<0.4)')],
            'soc': [('#8b5a2b', 'Tinggi (>50)'), ('#cd853f', 'Sedang (30-50)'), ('#deb887', 'Rendah (<30)')],
            'biomass': [('#228b22', 'Tinggi (>150)'), ('#32cd32', 'Sedang (80-150)'), ('#90ee90', 'Rendah (<80)')],
            'yield': [('#feb24c', 'Tinggi (>2.0)'), ('#f03b20', 'Sedang (1.2-2.0)'), ('#ffeda0', 'Rendah (<1.2)')],
            'soilnpk': [('#065f46', 'Optimal (>140)'), ('#0d9488', 'Cukup (100-140)'), ('#99f6e4', 'Defisit (<100)')],
            'nitrogen': [('#14532d', 'Tinggi (>0.75%)'), ('#22c55e', 'Sedang (0.55-0.75%)'), ('#eab308', 'Rendah (<0.55%)')],
            'phosphorus': [('#991b1b', 'Tinggi (>150 mg/kg)'), ('#ea580c', 'Sedang (50-150 mg/kg)'), ('#fed7aa', 'Rendah (<50 mg/kg)')],
            'potassium': [('#4c1d95', 'Tinggi (>150 mg/kg)'), ('#8b5cf6', 'Sedang (130-150 mg/kg)'), ('#93c5fd', 'Rendah (<130 mg/kg)')],
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
                style_function=lambda x: {'color': '#fdb134', 'fillColor': 'transparent', 'weight': 3}
            )
            bounds_layer.add_to(m)
            m.fit_bounds(bounds_layer.get_bounds())

        if has_access:
            if sample_points:
                unit_map = {
                    'soc': 'Ton C/Ha',
                    'biomass': 'Ton/Ha',
                    'yield': 'Ton/Ha',
                    'ndvi': '',
                    'nitrogen': '%',
                    'phosphorus': 'mg/kg',
                    'potassium': 'mg/kg',
                    'soilnpk': 'kg NPK/Ha'
                }
                unit_label = unit_map.get(layer_type, '')

                try:
                    if not farm_boundary_geojson:
                        raise ValueError("No boundary geojson")

                    from shapely.geometry import MultiPoint, Point, mapping, shape
                    from shapely.ops import voronoi_diagram
                    from shapely.strtree import STRtree

                    boundary_poly = shape(farm_boundary_geojson)

                    pts_list = [Point(p['lon'], p['lat']) for p in sample_points]
                    pts_multi = MultiPoint(pts_list)

                    # Buat voronoi diagram (ini akan menutupi semua ruang secara penuh tanpa ada celah antar titik)
                    vd = voronoi_diagram(pts_multi, envelope=boundary_poly)
                    polys = list(vd.geoms) if hasattr(vd, 'geoms') else []

                    if polys:
                        tree = STRtree(polys)

                        for i, point in enumerate(sample_points):
                            pt = pts_list[i]
                            val = float(point['value']) if point.get('value') is not None else 0.0
                            val_display = f"{val:.2f}"
                            color = GISService._get_color_for_value(val, layer_type)

                            matching_poly = None
                            res = tree.query(pt)
                            for idx in res:
                                if polys[idx].intersects(pt):
                                    matching_poly = polys[idx]
                                    break

                            if matching_poly:
                                clipped_geom = matching_poly.intersection(boundary_poly)
                                if not clipped_geom.is_empty:
                                    smoothed_geom = clipped_geom.buffer(0.000005)
                                    folium.GeoJson(
                                        data=mapping(smoothed_geom),
                                        style_function=lambda x, c=color: {
                                            'fillColor': c,
                                            'color': c,
                                            'stroke': False,
                                            'weight': 0,
                                            'fillOpacity': 0.95
                                        },
                                        tooltip=f"<b>{layer_type.upper()}:</b> {val_display} {unit_label}".strip()
                                    ).add_to(m)

                except Exception as e:
                    print("Error clipping geometry:", str(e))
                    # Fallback ke bentuk lingkaran jika gagal
                    for point in sample_points:
                        val = float(point['value']) if point.get('value') is not None else 0.0
                        val_display = f"{val:.2f}"
                        color = GISService._get_color_for_value(val, layer_type)
                        folium.Circle(
                            location=[point['lat'], point['lon']],
                            radius=5.5,
                            weight=0,
                            color=color,
                            fill=True,
                            fill_color=color,
                            fill_opacity=0.85,
                            tooltip=f"<b>{layer_type.upper()}:</b> {val_display} {unit_label}".strip()
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

        ref_pts_json = json.dumps([[p['lat'], p['lon']] for p in sample_points[:2]]) if (sample_points and len(sample_points) >= 2) else "[]"
        js_code = f"""
        <script>
            setTimeout(function() {{
                var mapInstance = null;
                var heatLayer = null;
                for (var key in window) {{
                    if (key.startsWith('map_')) {{
                        mapInstance = window[key];
                    }}
                    if (key.startsWith('heat_map_')) {{
                        heatLayer = window[key];
                    }}
                }}

                if (mapInstance) {{
                    var refPts = {ref_pts_json};
                    function updateHeatScale() {{
                        if (heatLayer && refPts && refPts.length >= 2) {{
                            var p1 = mapInstance.latLngToContainerPoint(refPts[0]);
                            var p2 = mapInstance.latLngToContainerPoint(refPts[1]);
                            var dist = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
                            if (dist > 5) {{
                                var newR = Math.max(35, Math.round(dist * 0.95));
                                var newB = Math.max(20, Math.round(newR * 0.6));
                                heatLayer.setOptions({{ radius: newR, blur: newB }});
                            }}
                        }}
                    }}
                    mapInstance.on('zoomend', updateHeatScale);
                    setTimeout(updateHeatScale, 250);

                    window.addEventListener('message', function(event) {{
                        if (event.data && event.data.type === 'SET_LAYER_OPACITY') {{
                            var targetOpacity = event.data.opacity / 100;
                            mapInstance.eachLayer(function(layer) {{
                                if (layer.setStyle && typeof layer.setStyle === 'function') {{
                                    layer.setStyle({{
                                        fillOpacity: targetOpacity * 0.7,
                                        opacity: targetOpacity
                                    }});
                                }}
                                if (layer._canvas) {{
                                    layer._canvas.style.opacity = targetOpacity;
                                }}
                            }});
                        }}
                    }});
                }}
            }}, 300);
        </script>
        """
        m.get_root().html.add_child(folium.Element(js_code))

        return m.get_root().render()
