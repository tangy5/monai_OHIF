import React from 'react';
import ModelSelector from '../ModelSelector';
import BaseTab from './BaseTab';

export default class AutoSegmentation extends BaseTab {
  constructor(props) {
    super(props);

    this.modelSelector = React.createRef();
    this.state = {
      currentModel: null,
    };
  }

  onSelectModel = model => {
    this.setState({ currentModel: model });
  };

  onSegmentation = async () => {
    const nid = this.notification.show({
      title: 'MONAI Label',
      message: 'Running Auto-Segmentation...',
      type: 'info',
      duration: 60000,
    });

    // TODO:: Fix Image ID...
    const { info, viewConstants } = this.props;
    console.log(viewConstants)
    const image = viewConstants.SeriesInstanceUID;
    // const model = this.modelSelector.current.currentModel();
    // const config = this.props.onOptionsConfig();
    // // const params =
    // //   config && config.infer && config.infer[model] ? config.infer[model] : {};

    // const labels = info.models[model].labels;
    // // const response = await this.props
    // //   .client()
    // //   .segmentation(model, image, params);
    console.log(window.imageURL)

    const data = {
      image: window.imageURL,
      prompts: {
        classes: "",
      },
    }
    console.log("In onSegmentation", data)
    // const response = await this.props.client().healthcheck('random', { someParam: 'value' });

    const response = await this.props.client().inference(data);

    // Bug:: Notification Service on show doesn't return id
    // if (!nid) {
    //   window.snackbar.hideAll();
    // } else {
    //   this.notification.hide(nid);
    // }

    // if (response.status !== 200) {
    //   this.notification.show({
    //     title: 'MONAI Label',
    //     message: 'Failed to Run Segmentation',
    //     type: 'error',
    //     duration: 5000,
    //   });
    // } else {
    //   this.notification.show({
    //     title: 'MONAI Label',
    //     message: 'Run Segmentation - Successful',
    //     type: 'success',
    //     duration: 2000,
    //   });

    //   await this.props.updateView(response, labels);
    // }
  };

  render() {
    let models = [];
    if (this.props.info && this.props.info.models) {
      for (let [name, model] of Object.entries(this.props.info.models)) {
        if (model.type === 'segmentation') {
          models.push(name);
        }
      }
    }

    return (
      <div className="tab">
        <input
          type="radio"
          name="rd"
          id={this.tabId}
          className="tab-switch"
          value="segmentation"
          onClick={this.onSelectActionTab}
          defaultChecked
        />
        <label htmlFor={this.tabId} className="tab-label">
          Auto-Segmentation
        </label>
        <div className="tab-content">
            <button
                className="actionInput"
                style={{backgroundColor:'lightgray'}}
                onClick={this.onSegmentation}
              >
                Run
            </button>
        </div>
      </div>
    );
  }
}
