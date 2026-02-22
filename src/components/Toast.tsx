import React, { useState, useCallback, useEffect } from 'react';

let showToastFn: ((msg: string) => void) | null = null;

export function showToast(msg: string) {
  if (showToastFn) showToastFn(msg);
}

export function Toast() {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);

  showToastFn = useCallback((msg: string) => {
    setMessage(msg);
    setVisible(true);
    setTimeout(() => setVisible(false), 2500);
  }, []);

  return (
    <div className={`toast ${visible ? 'show' : ''}`} id="toast">
      {message}
    </div>
  );
}
