import axios from 'axios';

export default class MonaiLabelClient {
  constructor(server_url) {
    this.server_url = new URL(server_url);
  }

  async info() {
    const url = new URL(this.server_url + 'v1/vista3d/info').toString();

    const response = await axios.get(url);
    return response.data; // Return just the data from the response
  }

  async segmentation(model, image, params = {}, label = null) {
    // label is used to send label volumes, e.g. scribbles,
    // that are to be used during segmentation
    return this.infer(model, image, params, label);
  }


  async inference(data) {
    const url = new URL(this.server_url+'v1/vista3d/inference').toString();

    console.log(data)
    const response = await axios.post(url, data, {
        headers: {
            'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer' 
    });

    console.log('inference response:', response)

    if (response.status === 200) {
        console.log("Response Success, saved inference results into output.zip");
    } else {
        console.error(`Request failed with status ${response.status}`);
    }
}


  async healthcheck(strategy = 'random', params = {}) {
    const url = new URL(this.server_url + 'v1/health/ready').toString();

    try {
        const response = await axios.get(url, { params });
        console.log('Response health check:', response);
        return response.data; // Return just the data from the response
    } catch (error) {
        console.error('Health check failed:', error);
        throw error; // Re-throw the error after logging it
    }
}

  async save_label(image, label, params) {
    let url = new URL('datastore/label', this.server_url);
    url.searchParams.append('image', image);
    url = url.toString();

    /* debugger; */

    const data = MonaiLabelClient.constructFormDataFromArray(
      params,
      label,
      'label',
      'label.bin'
    );

    return await MonaiLabelClient.api_put_data(url, data, 'json');
  }

  static constructFormDataFromArray(params, data, name, fileName) {
    let formData = new FormData();
    formData.append('params', JSON.stringify(params));
    formData.append(name, data, fileName);
    return formData;
  }

  static constructFormData(params, files) {
    let formData = new FormData();
    formData.append('params', JSON.stringify(params));

    if (files) {
      if (!Array.isArray(files)) {
        files = [files];
      }
      for (let i = 0; i < files.length; i++) {
        formData.append(files[i].name, files[i].data, files[i].fileName);
      }
    }
    return formData;
  }

  static constructFormOrJsonData(params, files) {
    return files ? MonaiLabelClient.constructFormData(params, files) : params;
  }

  static api_get(url) {
    console.debug('GET:: ' + url);
    return axios
      .get(url)
      .then(function (response) {
        console.debug(response);
        return response;
      })
      .catch(function (error) {
        return error;
      })
      .finally(function () {});
  }

  static api_delete(url) {
    console.debug('DELETE:: ' + url);
    return axios
      .delete(url)
      .then(function (response) {
        console.debug(response);
        return response;
      })
      .catch(function (error) {
        return error;
      })
      .finally(function () {});
  }

  static api_post(
    url,
    params,
    files,
    form = true,
    responseType = 'arraybuffer'
  ) {
    const data = form
      ? MonaiLabelClient.constructFormData(params, files)
      : MonaiLabelClient.constructFormOrJsonData(params, files);
    return MonaiLabelClient.api_post_data(url, data, responseType);
  }

  static api_post_data(url, data, responseType) {
    console.debug('POST:: ' + url);
    return axios
      .post(url, data, {
        responseType: responseType,
        headers: {
          accept: ['application/json', 'multipart/form-data'],
        },
      })
      .then(function (response) {
        console.debug(response);
        return response;
      })
      .catch(function (error) {
        return error;
      })
      .finally(function () {});
  }

  static api_put(url, params, files, form = false, responseType = 'json') {
    const data = form
      ? MonaiLabelClient.constructFormData(params, files)
      : MonaiLabelClient.constructFormOrJsonData(params, files);
    return MonaiLabelClient.api_put_data(url, data, responseType);
  }

  static api_put_data(url, data, responseType = 'json') {
    console.debug('PUT:: ' + url);
    return axios
      .put(url, data, {
        responseType: responseType,
        headers: {
          accept: ['application/json', 'multipart/form-data'],
        },
      })
      .then(function (response) {
        console.debug(response);
        return response;
      })
      .catch(function (error) {
        return error;
      });
  }
}
