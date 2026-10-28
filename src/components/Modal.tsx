import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useApp } from '../context/AppContext';

export function Modal({ title, children, footer }: { title: string; children: ReactNode; footer: ReactNode }) {
  const { closeModal } = useApp();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKey);
    // Focus the modal container on open
    modalRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [closeModal]);

  return (
    <div className="overlay" onMouseDown={(e) => e.currentTarget === e.target && closeModal()}>
      <div className="modal" ref={modalRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button onClick={closeModal} aria-label="Close dialog">&times;</button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-foot">{footer}</div>
      </div>
    </div>
  );
}
