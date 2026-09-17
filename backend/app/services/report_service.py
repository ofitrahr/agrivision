import pandas as pd
from flask import render_template
import io

class ReportService:
    @staticmethod
    def generated_pdf_report(report_data):
        try:
            from weasyprint import HTML, CSS
        except (ImportError, OSError) as e:
            raise RuntimeError(
                "WeasyPrint tidak tersedia di sistem ini. "
                "PDF report hanya bisa digenerate di Linux (Docker/production). "
                f"Detail: {e}"
            )

        rendered_html = render_template('reports/corporate_report.html', data=report_data)
        pdf_buffer = io.BytesIO()
        HTML(string=rendered_html).write_pdf(pdf_buffer)

        pdf_buffer.seek(0)
        return pdf_buffer

    @staticmethod
    def generated_excel_raw_data(report_data):
        excel_buffer = io.BytesIO()
        with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
            # Sheet 1: Ringkasan Dokumen Laporan
            meta_rows = [
                {'Atribut': 'Judul Dokumen', 'Nilai': report_data.get('header_title', report_data.get('title', '-'))},
                {'Atribut': 'Cakupan Lahan', 'Nilai': report_data.get('farm_name', '-')},
                {'Atribut': 'Periode Laporan', 'Nilai': report_data.get('period', '-')},
                {'Atribut': 'Total Luas (Ha)', 'Nilai': f"{report_data.get('total_area_ha', 0)} Ha"},
                {'Atribut': 'Komoditas Utama', 'Nilai': report_data.get('commodity', '-')},
                {'Atribut': 'Waktu Dibuat', 'Nilai': report_data.get('generated_at', '-')},
            ]
            pd.DataFrame(meta_rows).to_excel(writer, index=False, sheet_name='Ringkasan Laporan')

            # Sheet 2: Direktori / Daftar Lahan Terpilih
            if report_data.get('selected_farms'):
                farms_rows = []
                for idx, f in enumerate(report_data['selected_farms'], 1):
                    farms_rows.append({
                        'No': idx,
                        'Nama Lahan': f.get('name', '-'),
                        'Lokasi': f.get('location', '-'),
                        'Varietas Komoditas': f.get('commodity', '-'),
                        'Elevasi': f.get('altitude', '-'),
                        'Luas (Ha)': f.get('area_ha', 0)
                    })
                pd.DataFrame(farms_rows).to_excel(writer, index=False, sheet_name='Daftar Lahan')

            # Sheet 3: Seluruh Indikator & Metrik Operasional
            if report_data.get('raw_data'):
                pd.DataFrame(report_data['raw_data']).to_excel(writer, index=False, sheet_name='Metrik Operasional')

            # Sheet 4: Data Petani Binaan
            if report_data.get('social', {}).get('farmers_list'):
                farmers_rows = []
                for idx, farmer in enumerate(report_data['social']['farmers_list'], 1):
                    farmers_rows.append({
                        'No': idx,
                        'Nama Petani': farmer.get('name', '-'),
                        'Jenis Kelamin': farmer.get('gender', '-'),
                        'Usia (Tahun)': farmer.get('age', '-'),
                        'Tahun Bergabung': farmer.get('join_year', '-')
                    })
                pd.DataFrame(farmers_rows).to_excel(writer, index=False, sheet_name='Petani Binaan')

            # Sheet 5: Batch Produksi & Traceability
            if report_data.get('traceability', {}).get('batches'):
                batch_rows = []
                for idx, b in enumerate(report_data['traceability']['batches'], 1):
                    batch_rows.append({
                        'No': idx,
                        'Nomor Batch': b.get('batch_number', '-'),
                        'Nama Produk': b.get('product_name', '-'),
                        'Tanggal Panen': b.get('harvest_date', '-'),
                        'Status': b.get('status', '-')
                    })
                pd.DataFrame(batch_rows).to_excel(writer, index=False, sheet_name='Batch Rantai Pasok')

        excel_buffer.seek(0)
        return excel_buffer
    
