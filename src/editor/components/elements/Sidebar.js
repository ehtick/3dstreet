import {
  cloneEntity,
  removeSelectedEntity,
  renameEntity,
  getEntityIcon,
  setFocusCameraPose
} from '../../lib/entity';
import { Button, PanelToggleButton } from '../elements';
import ComponentsContainer from './ComponentsContainer';
import Events from '../../lib/Events';
import Mixins from '../widgets/Mixins';
import PropTypes from 'prop-types';
import React from 'react';
import capitalize from 'lodash-es/capitalize';
import classnames from 'classnames';
import AddGeneratorComponent from './AddGeneratorComponent';
import {
  ArrowRightIcon,
  Object24IconCyan,
  ArrowLeftHookIcon,
  Edit24Icon,
  TrashIcon,
  Copy32Icon,
  ArrowsPointingInwardIcon
} from '../../icons';
import GeoSidebar from './GeoSidebar';
import EnviroSidebar from './EnviroSidebar';
import ViewerSidebar from './ViewerSidebar';
import IntersectionSidebar from './IntersectionSidebar';
import StreetSegmentSidebar from './StreetSegmentSidebar';
import ManagedStreetSidebar from './ManagedStreetSidebar';
import MeasureLineSidebar from './MeasureLineSidebar';
import UserLayersSidebar from './UserLayersSidebar';
import AdvancedComponents from './AdvancedComponents';
export default class Sidebar extends React.Component {
  static propTypes = {
    entity: PropTypes.object,
    visible: PropTypes.bool
  };

  constructor(props) {
    super(props);
    this.state = {
      showSideBar: true
    };
  }

  getParentComponentName = (entity) => {
    const componentName = entity.getAttribute('data-parent-component');
    const parentEntity = entity.parentElement;
    return componentName
      ? `${parentEntity.getAttribute('data-layer-name') || 'Entity'}:${componentName}`
      : 'Unknown';
  };

  hasParentComponent = (entity) => {
    return entity.getAttribute('data-parent-component');
  };

  fireParentComponentDetach = (entity) => {
    const componentName = entity.getAttribute('data-parent-component');
    const parentEntity = entity.parentElement;
    parentEntity.components[componentName].detach();
  };

  selectParentEntity = (entity) => {
    AFRAME.INSPECTOR.selectEntity(entity.parentElement);
  };

  onEntityUpdate = (detail) => {
    if (detail.entity !== this.props.entity) {
      return;
    }
    if (
      detail.component === 'mixin' ||
      detail.component === 'data-layer-name'
    ) {
      this.forceUpdate();
    }
  };

  onComponentRemove = (detail) => {
    if (detail.entity !== this.props.entity) {
      return;
    }
    this.forceUpdate();
  };

  onComponentAdd = (detail) => {
    if (detail.entity !== this.props.entity) {
      return;
    }
    this.forceUpdate();
  };

  componentDidMount() {
    Events.on('entityupdate', this.onEntityUpdate);
    Events.on('componentremove', this.onComponentRemove);
    Events.on('componentadd', this.onComponentAdd);
  }

  componentWillUnmount() {
    Events.off('entityupdate', this.onEntityUpdate);
    Events.off('componentremove', this.onComponentRemove);
    Events.off('componentadd', this.onComponentAdd);
  }

  // additional toggle for hide/show panel by clicking the button
  toggleRightBar = () => {
    this.setState({ showSideBar: !this.state.showSideBar });
  };

  render() {
    const entity = this.props.entity;
    const visible = this.props.visible;
    const className = classnames({
      outliner: true,
      hide: this.state.showSideBar,
      'mt-16': true
    });
    if (entity && visible) {
      const entityName = entity.getDOMAttribute('data-layer-name');
      const entityMixin = entity.getDOMAttribute('mixin');
      const formattedMixin = entityMixin
        ? capitalize(entityMixin.replaceAll('-', ' ').replaceAll('_', ' '))
        : null;
      return (
        <div className={className} tabIndex="0">
          {this.state.showSideBar ? (
            <>
              <div id="layers-title" onClick={this.toggleRightBar}>
                <div className="layersBlock">
                  <div className="icon-container">{getEntityIcon(entity)}</div>
                  <span>{entityName || formattedMixin}</span>
                </div>
                <div id="toggle-rightbar">
                  <ArrowRightIcon />
                </div>
              </div>
              <div className="scroll">
                {entity.id !== 'reference-layers' &&
                entity.id !== 'environment' &&
                entity.id !== 'cameraRig' &&
                entity.id !== 'street-container' &&
                !entity.getAttribute('street-segment') ? (
                  <>
                    {entity.classList.contains('autocreated') && (
                      <div className="sidepanelContent">
                        <div className="flex items-center gap-2">
                          Autocreated Entity
                        </div>
                        {this.hasParentComponent(entity) && (
                          <>
                            <div className="collapsible-content">
                              <div className="propertyRow">
                                <label className="text">Managed by</label>
                                <input
                                  className="string"
                                  type="text"
                                  value={this.getParentComponentName(entity)}
                                  readOnly
                                />
                              </div>
                            </div>
                            <div id="sidebar-buttons">
                              <Button
                                variant={'toolbtn'}
                                onClick={() => this.selectParentEntity(entity)}
                              >
                                <ArrowLeftHookIcon /> Edit Clone Settings
                              </Button>
                              <Button
                                variant={'toolbtn'}
                                onClick={() =>
                                  this.fireParentComponentDetach(entity)
                                }
                              >
                                <Object24IconCyan />
                                Detach
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    <div className="sidepanelContent">
                      {entity.hasAttribute('data-no-transform') ? (
                        <></>
                      ) : (
                        <div id="sidebar-buttons-small">
                          <Button
                            variant={'toolbtn'}
                            onClick={() =>
                              Events.emit('objectfocus', entity.object3D)
                            }
                            onLongPress={() => setFocusCameraPose(entity)}
                            longPressDelay={1500} // Optional, defaults to 2000ms
                            leadingIcon={<ArrowsPointingInwardIcon />}
                          >
                            Focus
                          </Button>
                          <Button
                            variant={'toolbtn'}
                            onClick={() => renameEntity(entity)}
                            leadingIcon={<Edit24Icon />}
                          >
                            Rename
                          </Button>
                          <Button
                            variant={'toolbtn'}
                            onClick={() => cloneEntity(entity)}
                            leadingIcon={<Copy32Icon />}
                          >
                            Duplicate
                          </Button>
                          <Button
                            variant={'toolbtn'}
                            onClick={() => removeSelectedEntity()}
                            leadingIcon={<TrashIcon />}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                      {!!entity.mixinEls.length &&
                        !entity.classList.contains('autocreated') && (
                          <div className="details">
                            <Mixins entity={entity} />
                          </div>
                        )}
                    </div>

                    {entity.getAttribute('intersection') && (
                      <IntersectionSidebar entity={entity} />
                    )}
                    {entity.getAttribute('managed-street') && (
                      <ManagedStreetSidebar entity={entity} />
                    )}
                    {entity.getAttribute('measure-line') && (
                      <>
                        <MeasureLineSidebar entity={entity} />
                        <div className="propertyRow">
                          <AdvancedComponents entity={entity} />
                        </div>
                      </>
                    )}
                    {!entity.getAttribute('measure-line') && (
                      <ComponentsContainer entity={entity} />
                    )}
                  </>
                ) : (
                  <>
                    {entity.getAttribute('street-segment') && (
                      <>
                        <StreetSegmentSidebar entity={entity} />
                        <hr />
                        <AddGeneratorComponent entity={entity} />
                        <hr />
                        <div className="advancedComponentsContainer">
                          <AdvancedComponents entity={entity} />
                        </div>
                      </>
                    )}
                    {entity.id === 'reference-layers' && (
                      <GeoSidebar entity={entity} />
                    )}
                    {entity.id === 'environment' && (
                      <EnviroSidebar entity={entity} />
                    )}
                    {entity.id === 'cameraRig' && (
                      <ViewerSidebar entity={entity} />
                    )}
                    {entity.id === 'street-container' && (
                      <UserLayersSidebar entity={entity} />
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <PanelToggleButton
                icon={() => getEntityIcon(entity)}
                isOpen={this.state.showSideBar}
                onClick={this.toggleRightBar}
                className="relative flex items-center justify-end"
              >
                <span className="absolute right-12 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-white opacity-0 transition-all duration-300 group-hover:opacity-100">
                  {entityName || formattedMixin}
                </span>
              </PanelToggleButton>
            </>
          )}
        </div>
      );
    } else {
      return <div />;
    }
  }
}
