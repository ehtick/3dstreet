import useStore from '@/store';
import { Button } from '../elements/Button';
import { useEffect } from 'react';
import TimeControls from '../elements/TimeControls';

function Toolbar({ entity }) {
  const { isInspectorEnabled, setIsInspectorEnabled } = useStore();

  useEffect(() => {
    useStore.getState().startRecordingCheck();
    return () => {
      useStore.getState().stopRecordingCheck();
    };
  }, []);

  if (isInspectorEnabled) return null;

  return (
    <div id="toolbar" data-inspector="false">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex flex-shrink-0 items-center space-x-2">
            <img
              src="/ui_assets/3D-St-stacked-128.png"
              alt="3DStreet Logo"
              style={{ width: '48px', height: '48px', objectFit: 'contain' }}
            />
            <Button
              onClick={() => setIsInspectorEnabled(!isInspectorEnabled)}
              variant="toolbtn"
            >
              Editor
            </Button>
          </div>
          <div>
            <TimeControls entity={entity} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Toolbar;
