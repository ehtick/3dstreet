import React from 'react';
import PropTypes from 'prop-types';
import Select, { components } from 'react-select';
import Events from '../../lib/Events';
import { DropdownArrowIcon } from '../../icons';

export default class Mixin extends React.Component {
  static propTypes = {
    entity: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.state = { mixins: this.getMixinValue() };
  }

  onEntityUpdate = (detail) => {
    if (detail.entity !== this.props.entity) {
      return;
    }
    if (detail.component === 'mixin') {
      this.setState({ mixins: this.getMixinValue() });
    }
  };

  componentDidMount() {
    Events.on('entityupdate', this.onEntityUpdate);
  }

  componentWillUnmount() {
    Events.off('entityupdate', this.onEntityUpdate);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.entity === prevProps.entity) {
      return;
    }
    this.setState({ mixins: this.getMixinValue() });
  }

  getMixinValue() {
    return (this.props.entity.getAttribute('mixin') || '')
      .split(/\s+/g)
      .filter((v) => !!v)
      .map((v) => ({ label: v, value: v }));
  }

  getGroupedMixinOptions = () => {
    const mixinElements = document.querySelectorAll('a-mixin');
    const groupedArray = [];
    let categoryName, mixinId;

    const groupedObject = {};
    for (let mixinEl of Array.from(mixinElements)) {
      categoryName = mixinEl.getAttribute('category');
      if (!categoryName) continue;
      mixinId = mixinEl.id;
      if (!groupedObject[categoryName]) {
        groupedObject[categoryName] = [];
      }
      groupedObject[categoryName].push({ label: mixinId, value: mixinId });
    }

    for (let categoryName of Object.keys(groupedObject)) {
      groupedArray.push({
        label: categoryName,
        options: groupedObject[categoryName]
      });
    }
    return groupedArray;
  };

  updateMixins = (value) => {
    const entity = this.props.entity;
    this.setState({ mixins: value });
    const mixinStr = value.map((v) => v.value).join(' ');
    AFRAME.INSPECTOR.execute('entityupdate', {
      component: 'mixin',
      entity: entity,
      value: mixinStr
    });
  };

  updateMixinSingle = (value) => {
    const entity = this.props.entity;
    this.setState({ mixins: value });
    const mixinStr = value.value;
    AFRAME.INSPECTOR.execute('entityupdate', {
      component: 'mixin',
      entity: entity,
      value: mixinStr
    });
  };

  render() {
    const groupStyles = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    };

    const formatGroupLabel = (data) => (
      <div style={groupStyles}>
        <span>{data.label}</span>
      </div>
    );

    const handleHeaderClick = (id) => {
      const node = document.querySelector(`#${id}`).parentElement
        .nextElementSibling;
      const classes = node.classList;
      if (classes.contains('collapsed')) {
        node.classList.remove('collapsed');
      } else {
        node.classList.add('collapsed');
      }
    };

    const CustomGroupHeading = (props) => {
      return (
        <div
          className="group-heading-wrapper"
          onClick={() => handleHeaderClick(props.id)}
        >
          <components.GroupHeading className="collapsed" {...props} />
        </div>
      );
    };

    return (
      <div className="mixinOptions">
        <div className="propertyRow">
          <span className="text">Model</span>
          <span className="mixinValue">
            {this.state.mixins.length >= 2 ? (
              <Select
                id="mixinSelect"
                classNamePrefix="select"
                options={this.getGroupedMixinOptions()}
                components={{
                  GroupHeading: CustomGroupHeading,
                  DropdownIndicator: DropdownArrowIcon,
                  IndicatorSeparator: () => null
                }}
                formatGroupLabel={formatGroupLabel}
                isMulti={true}
                placeholder="Search mixins..."
                noResultsText="No mixins found"
                onChange={this.updateMixins.bind(this)}
                simpleValue
                value={this.state.mixins}
              />
            ) : (
              <Select
                id="mixinSelect"
                classNamePrefix="select-single"
                options={this.getGroupedMixinOptions()}
                components={{
                  GroupHeading: CustomGroupHeading,
                  DropdownIndicator: DropdownArrowIcon,
                  IndicatorSeparator: () => null
                }}
                formatGroupLabel={formatGroupLabel}
                isMulti={false}
                isSearchable={true}
                isClearable={false}
                placeholder="Search models..."
                noResultsText="No models found"
                onChange={this.updateMixinSingle.bind(this)}
                simpleValue
                value={this.state.mixins}
              />
            )}
          </span>
        </div>
      </div>
    );
  }
}
