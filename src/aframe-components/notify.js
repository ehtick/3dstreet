/* global AFRAME */
var { Notyf } = require('../lib/notyf.min.js');

AFRAME.registerComponent('notify', {
  schema: {
    duration: { type: 'number', default: 3000 },
    ripple: { type: 'boolean', default: false },
    position: {
      type: 'string',
      default: {
        // x: left | center | right
        // y: top | center | bottom
        x: 'center',
        y: 'top'
      }
    },
    dismissible: { type: 'boolean', default: false },
    type: { type: 'string', default: 'info' },
    message: { type: 'string', default: '' }
  },
  init: function () {
    this.notify = new Notyf({
      types: [
        {
          type: 'info',
          background: 'blue',
          icon: false
        },
        {
          type: 'warning',
          background: 'orange',
          icon: false
        }
      ],
      // Set your global Notyf configuration here
      duration: this.data.duration,
      ripple: this.data.ripple,
      position: this.data.position,
      dismissible: this.data.dismissible
    });
    this.types = this.notify.options.types.map((messType) => messType.type);

    // add notify methods to STREET global objects
    if (STREET) {
      STREET.notify = {};
      STREET.notify.successMessage = (messageText) => {
        return this.message(messageText, 'success');
      };
      STREET.notify.errorMessage = (messageText) => {
        return this.message(messageText, 'error');
      };
      STREET.notify.warningMessage = (messageText) => {
        return this.message(messageText, 'warning');
      };
      STREET.notify.dismissNotification = (notification) => {
        return this.notify.dismiss(notification);
      };
    }
  },
  message: function (messageText, messageType = 'info') {
    if (messageText && this.types.includes(messageType)) {
      return this.notify.open({
        type: messageType,
        message: messageText
      });
    }
  },
  update: function (oldData) {
    // If `oldData` is empty, then this means we're in the initialization process.
    // No need to update.
    if (Object.keys(oldData).length === 0) {
      return;
    }

    const newMessage = this.data.message;
    const messageType = this.data.type;

    if (newMessage && this.types.includes(messageType)) {
      this.message(newMessage, messageType);
      this.data.message = '';
    }
  }
});
