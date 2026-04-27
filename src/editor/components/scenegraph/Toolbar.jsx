import useStore from '@/store';
import { Button } from '../elements/Button';

function Toolbar() {
  const { isInspectorEnabled, setIsInspectorEnabled } = useStore();

  if (isInspectorEnabled) return null;

  return (
    <div id="toolbar" data-inspector="false">
      <div className="flex flex-shrink-0 items-center space-x-2">
        <img
          src="/ui_assets/3D-St-stacked-128.png"
          alt="3DStreet Logo"
          style={{ width: '48px', height: '48px', objectFit: 'contain' }}
        />
        <Button onClick={() => setIsInspectorEnabled(true)} variant="toolbtn">
          Edit
        </Button>
      </div>
    </div>
  );
}

export default Toolbar;
