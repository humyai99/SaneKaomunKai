import { Toaster as SonnerToaster } from 'sonner@2.0.3';

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'white',
          border: '1px solid #e5e7eb',
          color: '#374151',
        },
        className: 'class',
        descriptionClassName: 'class',
        actionButtonStyle: {
          background: '#761F1C',
          color: 'white',
        },
        cancelButtonStyle: {
          background: '#f3f4f6',
          color: '#374151',
        },
      }}
    />
  );
}