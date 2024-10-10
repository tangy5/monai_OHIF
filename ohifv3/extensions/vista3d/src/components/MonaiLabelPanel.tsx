import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { cache, triggerEvent, eventTarget } from '@cornerstonejs/core';
import { Enums } from '@cornerstonejs/tools';
import './MonaiLabelPanel.css';
import SettingsTable from './SettingsTable';
import AutoSegmentation from './actions/AutoSegmentation';
import SmartEdit from './actions/SmartEdit';
import OptionTable from './actions/OptionTable';
import ActiveLearning from './actions/ActiveLearning';
import MonaiLabelClient from '../services/MonaiLabelClient';
import SegmentationReader from '../utils/SegmentationReader';
import MonaiSegmentation from './MonaiSegmentation';
import SegmentationToolbox from './SegmentationToolbox';
import backgroundColors from '@cornerstonejs/core/dist/types/constants/backgroundColors';

export default class MonaiLabelPanel extends Component {
  static propTypes = {
    commandsManager: PropTypes.any,
    servicesManager: PropTypes.any,
    extensionManager: PropTypes.any,
  };

  notification: any;
  settings: any;
  state: { info: {}; action: {} };
  actions: {
    options: any;
    activelearning: any;
    segmentation: any;
    smartedit: any;
  };
  props: any;
  SeriesInstanceUID: any;
  StudyInstanceUID: any;

  constructor(props) {
    super(props);

    const { uiNotificationService, viewportGridService, displaySetService } =
      props.servicesManager.services;

    this.notification = uiNotificationService;
    this.settings = React.createRef();

    this.actions = {
      options: React.createRef(),
      activeLearning: React.createRef(),
      segmentation: React.createRef(),
      smartedit: React.createRef(),
    };


    this.state = {
      info: {},
      action: {},
      segmentations: [],
    };

 


    // Todo: fix this hack
    setTimeout(() => {
      const { viewports, activeViewportId } = viewportGridService.getState();
      const viewport = viewports.get(activeViewportId);

      const displaySet = displaySetService.getDisplaySetByUID(
        viewport.displaySetInstanceUIDs[0]
      );

      this.SeriesInstanceUID = displaySet.SeriesInstanceUID;
      this.StudyInstanceUID = displaySet.StudyInstanceUID;

      this.FrameOfReferenceUID = displaySet.instances[0].FrameOfReferenceUID;
      this.displaySetInstanceUID = displaySet.displaySetInstanceUID;
    }, 1000);
  }

  async componentDidMount() {
    const { segmentationService } = this.props.servicesManager.services;
    const added = segmentationService.EVENTS.SEGMENTATION_ADDED;
    const updated = segmentationService.EVENTS.SEGMENTATION_UPDATED;
    const removed = segmentationService.EVENTS.SEGMENTATION_REMOVED;
    const subscriptions = [];

    [added, updated, removed].forEach((evt) => {
      const { unsubscribe } = segmentationService.subscribe(evt, () => {
        const segmentations = segmentationService.getSegmentations();

        if (!segmentations?.length) {
          return;
        }

        this.setState({ segmentations });
      });
      subscriptions.push(unsubscribe);
    });

    this.unsubscribe = () => {
      subscriptions.forEach((unsubscribe) => unsubscribe());
    };
  }

  // componentDidUnmount? Doesn't exist this method anymore in V3?
  async componentWillUnmount() {
    this.unsubscribe();
  }

  client = () => {
    const settings =
      this.settings && this.settings.current && this.settings.current.state
        ? this.settings.current.state
        : null;
    return new MonaiLabelClient(
      settings ? settings.url : 'http://127.0.0.1:8000'
    );
  };

  onInfo = async () => {
    this.notification.show({
      title: 'MONAI Label',
      message: 'Connecting to MONAI Label',
      type: 'info',
      duration: 3000,
    });

    const response = await this.client().info();

    console.log('Info response:', response)


    const { uiNotificationService, viewportGridService, displaySetService } = this.props.servicesManager.services;

    const { viewports, activeViewportId } = viewportGridService.getState();
    const viewport = viewports.get(activeViewportId);
    this.SeriesInstanceUID = displaySetService.activeDisplaySets[0].SeriesInstanceUID;
    this.StudyInstanceUID = displaySetService.activeDisplaySets[0].StudyInstanceUID;
    
    const displaySet = displaySetService.getDisplaySetByUID(viewport.displaySetInstanceUIDs[0]);
  
    console.log(displaySet);
  
    this.SeriesInstanceUID = displaySet.SeriesInstanceUID;
    this.StudyInstanceUID = displaySet.StudyInstanceUID;
  
    // Get the pixel data of the first DICOM instance
    const instance = displaySet.instances[0];
    const imageId = instance.imageId; // This is usually how you get the imageId
  
    // Fetch the DICOM image data
    console.log(cache)
    const imageData = cache._imageCache; // Assuming you're using CornerstoneJS cache
    const firstEntry = Array.from(imageData.entries())[0][1].image.getPixelData(); // Get the first entry

    console.log(firstEntry)

    this.dicomBlob = new Blob([firstEntry], { type: 'application/dicom' });
    this.imageUrl = URL.createObjectURL(this.dicomBlob);
  
    console.log(this.imageUrl); // You can now use this URL for your API call


    const data = {
      image: this.imageUrl,
      prompts: {
        classes: "",
      },
    }
    console.log("In onSegmentation", data)
    // const response = await this.props.client().healthcheck('random', { someParam: 'value' });

    const response2 = await this.client().inference(data);
    console.log(response2)
    // remove the background
    // const labels = response.data.labels.splice(1)

    // const segmentations = [
    //   {
    //     id: '1',
    //     label: 'Segmentations',
    //     segments: labels.map((label, index) => ({
    //       segmentIndex: index + 1,
    //       label
    //     })),
    //     isActive: true,
    //     activeSegmentIndex: 1,
    //   },
    // ];

    // this.props.commandsManager.runCommand('loadSegmentationsForViewport', {
    //   segmentations
    // });

    // if (response.status !== 200) {
    //   this.notification.show({
    //     title: 'MONAI Label',
    //     message: 'Failed to Connect to MONAI Label Server',
    //     type: 'error',
    //     duration: 5000,
    //   });
    // } else {
    //   this.notification.show({
    //     title: 'MONAI Label',
    //     message: 'Connected to MONAI Label Server - Successful',
    //     type: 'success',
    //     duration: 2000,
    //   });

    //   this.setState({ info: response.data });
    // }
  };

  onSelectActionTab = (name) => {
    // Leave Event
    for (const action of Object.keys(this.actions)) {
      if (this.state.action === action) {
        if (this.actions[action].current)
          this.actions[action].current.onLeaveActionTab();
      }
    }

    // Enter Event
    for (const action of Object.keys(this.actions)) {
      if (name === action) {
        if (this.actions[action].current)
          this.actions[action].current.onEnterActionTab();
      }
    }
    this.setState({ action: name });
  };

  onOptionsConfig = () => {
    return this.actions['options'].current &&
      this.actions['options'].current.state
      ? this.actions['options'].current.state.config
      : {};
  };

  _update = async (response, labelNames) => {
    // Process the obtained binary file from the MONAI Label server
    /* const onInfoLabelNames = this.state.info.labels */
    const onInfoLabelNames = labelNames;

    console.info('These are the predicted labels');
    console.info(onInfoLabelNames);

    if (onInfoLabelNames.hasOwnProperty('background')){
delete onInfoLabelNames.background;
    }


    const ret = SegmentationReader.parseNrrdData(response.data);

    if (!ret) {
      throw new Error('Failed to parse NRRD data');
    }

    const { image: buffer, header } = ret;
    const data = new Uint16Array(buffer);

    // reformat centroids
    const centroidsIJK = new Map();
    for (const [key, value] of Object.entries(response.centroids)) {
      const segmentIndex = parseInt(value[0], 10);
      const image = value.slice(1).map((v) => parseFloat(v));
      centroidsIJK.set(segmentIndex, { image: image, world: [] });
    }

    const segmentations = [
      {
        id: '1',
        label: 'Segmentations',
        segments: Object.keys(onInfoLabelNames).map((key) => ({
          segmentIndex: onInfoLabelNames[key],
          label: key,
        })),
        isActive: true,
        activeSegmentIndex: 1,
        scalarData: data,
        FrameOfReferenceUID: this.FrameOfReferenceUID,
        centroidsIJK: centroidsIJK,
      },
    ];

    // Todo: rename volumeId
    const volumeLoadObject = cache.getVolume('1');
    if (volumeLoadObject) {
      const { scalarData } = volumeLoadObject;
      scalarData.set(data);
      triggerEvent(eventTarget, Enums.Events.SEGMENTATION_DATA_MODIFIED, {
        segmentationId: '1',
      });
      console.debug("updated the segmentation's scalar data");
    } else {
      this.props.commandsManager.runCommand('hydrateSegmentationsForViewport', {
        segmentations,
      });
    }
  };

  _debug = async () => {
    let nrrdFetch = await fetch('http://localhost:3000/pred2.nrrd');

    const info = {
      spleen: 1,
      'right kidney': 2,
      'left kidney': 3,
      liver: 6,
      stomach: 7,
      aorta: 8,
      'inferior vena cava': 9,
    };

    const nrrd = await nrrdFetch.arrayBuffer();

    this._update({ data: nrrd }, info);
  };

  parseResponse = (response) => {
    const buffer = response.data;
    const contentType = response.headers['content-type'];
    const boundaryMatch = contentType.match(/boundary=([^;]+)/i);
    const boundary = boundaryMatch ? boundaryMatch[1] : null;

    const text = new TextDecoder().decode(buffer);
    const parts = text
      .split(`--${boundary}`)
      .filter((part) => part.trim() !== '');

    // Find the JSON part and NRRD part
    const jsonPart = parts.find((part) =>
      part.includes('Content-Type: application/json')
    );
    const nrrdPart = parts.find((part) =>
      part.includes('Content-Type: application/octet-stream')
    );

    // Extract JSON data
    const jsonStartIndex = jsonPart.indexOf('{');
    const jsonEndIndex = jsonPart.lastIndexOf('}');
    const jsonData = JSON.parse(
      jsonPart.slice(jsonStartIndex, jsonEndIndex + 1)
    );

    // Extract NRRD data
    const binaryData = nrrdPart.split('\r\n\r\n')[1];
    const binaryDataEnd = binaryData.lastIndexOf('\r\n');

    const nrrdArrayBuffer = new Uint8Array(
      binaryData
        .slice(0, binaryDataEnd)
        .split('')
        .map((c) => c.charCodeAt(0))
    ).buffer;

    return { data: nrrdArrayBuffer, centroids: jsonData.centroids };
  };

  updateView = async (response, labelNames) => {
    const { data, centroids } = this.parseResponse(response);
    this._update({ data, centroids }, labelNames);
  };

  render() {
    return (
      <div className="monaiLabelPanel" style={{ backgroundColors: 'black' }}>
        <br style={{ margin: '3px', backgroundColors: 'black' }} />

        <SettingsTable ref={this.settings} onInfo={this.onInfo} />

        <hr className="separator" />

        <p className="subtitle">{this.state.info.name}</p>

        <div className="tabs scrollbar" id="style-3" style={{ backgroundColors: 'black' }}>

          {/* <ActiveLearning
            ref={this.actions['activelearning']}
            tabIndex={2}
            info={this.state.info}
            viewConstants={{
              SeriesInstanceUID: this.SeriesInstanceUID,
              StudyInstanceUID: this.StudyInstanceUID,
            }}
            client={this.client}
            notification={this.notification}
            onSelectActionTab={this.onSelectActionTab}
            onOptionsConfig={this.onOptionsConfig}
          /> */}

          <AutoSegmentation
            ref={this.actions['segmentation']}
            tabIndex={3}
            info={this.state.info}
            viewConstants={{
              SeriesInstanceUID: this.SeriesInstanceUID,
              StudyInstanceUID: this.StudyInstanceUID,
              imageUrl: window.imageUrl,
            }}
            client={this.client}
            notification={this.notification}
            updateView={this.updateView}
            onSelectActionTab={this.onSelectActionTab}
            onOptionsConfig={this.onOptionsConfig}
          />
          {/* <SmartEdit
            ref={this.actions['smartedit']}
            tabIndex={4}
            servicesManager={this.props.servicesManager}
            commandsManager={this.props.commandsManager}
            info={this.state.info}
            viewConstants={{
              SeriesInstanceUID: this.SeriesInstanceUID,
              StudyInstanceUID: this.StudyInstanceUID,
            }}
            client={this.client}
            notification={this.notification}
            updateView={this.updateView}
            onSelectActionTab={this.onSelectActionTab}
            onOptionsConfig={this.onOptionsConfig}
          /> */}
        </div>

        {this.state.segmentations?.map((segmentation) => (
          <>
            <SegmentationToolbox servicesManager={this.props.servicesManager} />
            <MonaiSegmentation
              servicesManager={this.props.servicesManager}
              extensionManager={this.props.extensionManager}
              commandsManager={this.props.commandsManager}
            />
          </>
        ))}
      </div>
    );
  }
}
