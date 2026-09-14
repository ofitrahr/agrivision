import pandas as pd
from flask import render_template
import io
from weasyprint import HTML, CSS

class ReportService:
    @staticmethod
    def generated_pdf_report(report_data):
        rendered_html = render_template('reports/corporate_report.html', data=report_data)
        pdf_buffer = io.BytesIO()
        HTML(string=rendered_html).write_pdf(pdf_buffer)

        pdf_buffer.seek(0)
        return pdf_buffer

    @staticmethod
    def generated_excel_raw_data(report_data):
        df = pd.DataFrame(report_data['raw_data'])
        excel_buffer = io.BytesIO()
        with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Raw Data')

        excel_buffer.seek(0)
        return excel_buffer
    
