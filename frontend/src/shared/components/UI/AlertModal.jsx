import { CheckCircle2, AlertCircle, AlertTriangle, Info, HelpCircle } from 'lucide-react';
import Modal from './Modal';

// Ikon, warna, dan judul default per tipe
const TYPE_CONFIG = {
  success: { Icon: CheckCircle2, color: '#116a3a', title: 'Berhasil' },
  error: { Icon: AlertCircle, color: '#ba1a1a', title: 'Terjadi Kesalahan' },
  warning: { Icon: AlertTriangle, color: '#b45309', title: 'Peringatan' },
  info: { Icon: Info, color: '#1d4ed8', title: 'Informasi' },
  confirm: { Icon: HelpCircle, color: '#012d1d', title: 'Konfirmasi' },
};

const AlertModal = ({ isOpen, onClose, title, message, type = 'info', onConfirm }) => {
  const { Icon, color, title: defaultTitle } = TYPE_CONFIG[type] ?? TYPE_CONFIG.info;
  const isConfirm = type === 'confirm';

  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || defaultTitle} maxWidth="420px">
      <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
        <Icon size={48} color={color} style={{ marginBottom: 12 }} />
        <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          {message}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: isConfirm ? 'flex-end' : 'center' }}>
        {isConfirm ? (
          <>
            <button className="modal-btn-cancel" onClick={onClose}>Batal</button>
            <button className="modal-btn-danger" onClick={handleConfirm}>Konfirmasi</button>
          </>
        ) : (
          <button className="modal-btn-primary" onClick={onClose}>OK</button>
        )}
      </div>
    </Modal>
  );
};

export default AlertModal;
