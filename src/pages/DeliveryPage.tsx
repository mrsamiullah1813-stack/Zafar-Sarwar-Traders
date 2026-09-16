import React from 'react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { DeliveryAreasPage } from '../components/DeliveryAreasPage';

interface DeliveryPageProps {
  onNavigate: (path: string) => void;
}

export const DeliveryPage: React.FC<DeliveryPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[{ label: 'Delivery & Logistics Coverage', active: true }]}
        onNavigateHome={() => onNavigate('/')}
      />

      <DeliveryAreasPage
        onBackToHome={() => onNavigate('/')}
      />
    </div>
  );
};
