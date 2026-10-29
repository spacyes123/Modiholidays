"""Local-only fixture for checking WhatsApp message preparation without sending."""
from pathlib import Path
root=Path(__file__).resolve().parent.parent
text=(root/'plan-my-holiday.html').read_text(encoding='utf-8')
text=text.replace('<script src="assets/config.js"></script>', '<script>window.MODI_HOLIDAYS_CONFIG={whatsappNumber:"919999999999"};</script>')
text=text.replace('src="assets/', 'src="../assets/').replace('href="assets/', 'href="../assets/')
out=root/'work';out.mkdir(exist_ok=True)
(out/'enquiry-configured.html').write_text(text,encoding='utf-8')
