import React from 'react';
import MonaiLabelPanel from './components/MonaiLabelPanel';


function getPanelModule({
  commandsManager,
  extensionManager,
  servicesManager,
}) {

  const WrappedMonaiLabelPanel = () => {
    return (
      <MonaiLabelPanel
      commandsManager={commandsManager}
      servicesManager={servicesManager}
      extensionManager={extensionManager}
      />
    );
  };

  return [
    {
      name: 'vista3d',
      iconName: 'tab-patient-info',
      iconLabel: 'MONAI',
      label: 'VISTA3D',
      secondaryLabel: 'VISTA3D',
      component: WrappedMonaiLabelPanel,
    },
  ];
}

export default getPanelModule;
