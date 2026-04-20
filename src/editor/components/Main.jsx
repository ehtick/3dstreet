import { ZoomButtons } from './elements';
import { useState, useEffect } from 'react';
import RightPanel from './scenegraph/RightPanel';
import Events from '../lib/Events';
import ModalTextures from './modals/ModalTextures';
import SceneGraph from './scenegraph/SceneGraph';
import { ScreenshotModal } from './modals/ScreenshotModal';
import { ShareModal } from './modals/ShareModal';
// import ViewportHUD from "./viewport/ViewportHUD";
import { SignInModal } from './modals/SignInModal';
import { ProfileModal } from './modals/ProfileModal';
import { firebaseConfig, app } from '@shared/services/firebase.js';
import { LoadScript } from '@react-google-maps/api';
import { GeoModal } from './modals/GeoModal';
import { ScenesModal } from './modals/ScenesModal';
import { PaymentModal } from './modals/PaymentModal';
import { AddLayerPanel } from './elements/AddLayerPanel';
import { GeoLocationDisplay } from './elements/GeoLocationDisplay';
import { NewModal } from './modals/NewModal';
import { LoadingSceneModal } from './modals/LoadingSceneModal';
import { ToolbarWrapper } from './scenegraph/ToolbarWrapper.jsx';
import { ActionBar } from './elements/ActionBar';
import { PrimaryToolbar } from './elements/PrimaryToolbar';
import useStore from '@/store';
import { AIChatProvider } from '../contexts/AIChatContext';

// Define the libraries array as a constant outside of the component
const GOOGLE_MAPS_LIBRARIES = ['places'];

export default function Main() {
  const [state, setState] = useState({
    entity: null,
    isModalTexturesOpen: false,
    sceneEl: AFRAME.scenes[0]
  });

  useEffect(() => {
    const htmlEditorButton = document?.querySelector(
      '.viewer-logo-start-editor-button'
    );
    htmlEditorButton && htmlEditorButton.remove();

    Events.on('opentexturesmodal', function (selectedTexture, textureOnClose) {
      setState((prevState) => ({
        ...prevState,
        selectedTexture: selectedTexture,
        isModalTexturesOpen: true,
        textureOnClose: textureOnClose
      }));
    });
    Events.on('entityselect', (entity) => {
      setState((prevState) => ({
        ...prevState,
        entity: entity
      }));
    });
  }, []);

  const onModalTextureOnClose = (value) => {
    setState((prevState) => ({
      ...prevState,
      isModalTexturesOpen: false
    }));
    if (state.textureOnClose) {
      state.textureOnClose(value);
    }
  };

  const scene = state.sceneEl;
  const isInspectorEnabled = useStore((state) => state.isInspectorEnabled);
  const panelsVisible = useStore((state) => state.panelsVisible);

  return (
    <div id="inspectorContainer">
      <ToolbarWrapper />
      {isInspectorEnabled && (
        <AIChatProvider firebaseApp={app}>
          <div>
            <SceneGraph
              scene={scene}
              selectedEntity={state.entity}
              visible={true}
            />
            {panelsVisible && (
              <RightPanel entity={state.entity} visible={true} />
            )}
            <div
              className="clickable"
              style={{
                position: 'absolute',
                top: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10
              }}
            >
              <PrimaryToolbar />
            </div>
            <div
              className="clickable"
              style={{
                position: 'absolute',
                bottom: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10
              }}
            >
              <ActionBar selectedEntity={state.entity} />
            </div>
          </div>
        </AIChatProvider>
      )}
      <ScreenshotModal />
      <ShareModal />
      <SignInModal />
      <PaymentModal />
      <ScenesModal />
      <ProfileModal />
      <NewModal />
      <LoadingSceneModal />
      <LoadScript
        googleMapsApiKey={firebaseConfig.apiKey}
        libraries={GOOGLE_MAPS_LIBRARIES}
      >
        <GeoModal />
      </LoadScript>
      <ModalTextures
        isOpen={state.isModalTexturesOpen}
        selectedTexture={state.selectedTexture}
        onClose={onModalTextureOnClose}
      />

      {isInspectorEnabled && (
        <>
          <div id="zoom-help-buttons">
            <ZoomButtons />
          </div>
          <div className="clickable">
            <AddLayerPanel />
          </div>
          <GeoLocationDisplay />
        </>
      )}
    </div>
  );
}
