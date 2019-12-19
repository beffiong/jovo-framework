import { ApiError } from './ApiError';
import { AlexaAPI, ApiCallOptions } from './AlexaAPI';
import { AlexaAPIResponse } from './AlexaAPIResponse';

export class AlexaDeviceAddress {
  static ADDRESS = 'address';
  static COUNTRY_AND_POSTAL_CODE = 'address/countryAndPostalCode';

  static async deviceAddressApi(
    property: string,
    apiEndpoint: string,
    apiAccessToken: string,
    deviceId: string,
  ) {
    const validProperties = [
      AlexaDeviceAddress.ADDRESS,
      AlexaDeviceAddress.COUNTRY_AND_POSTAL_CODE,
    ];
    if (!apiAccessToken) {
      throw new Error(`No apiAccessToken was found in that request`);
    }

    if (!validProperties.includes(property)) {
      throw new Error(`${property} is not a valid property`);
    }

    const options: ApiCallOptions = {
      endpoint: apiEndpoint,
      path: '/v1/devices/' + deviceId + '/settings/' + property,
      permissionToken: apiAccessToken,
    };

    try {
      const response: AlexaAPIResponse = await AlexaAPI.apiCall(options);

      if (response.httpStatus === 403) {
        const apiError = new ApiError(response.data.message, response.data.code);

        if (response.data.message === 'The authentication token is not valid.') {
          apiError.code = ApiError.NO_USER_PERMISSION; // user needs to grant access in app
        }

        if (response.data.message === 'Access to this resource has not yet been requested.') {
          apiError.code = ApiError.NO_USER_PERMISSION; // user needs to grant access in app
        }

        if (response.data.message === 'Access to this resource cannot be requested.') {
          apiError.code = ApiError.NO_SKILL_PERMISSION; // dev needs to set correct permissions in ASK console
        }

        if (
          response.data.code === 'ACCESS_DENIED' &&
          response.data.message === 'Access denied with reason: FORBIDDEN'
        ) {
          apiError.code = ApiError.NO_SKILL_PERMISSION; // dev needs to set correct permissions in ASK console
        }

        if (
          response.data.code === 'ACCESS_DENIED' &&
          response.data.message === 'Access denied with reason: ACCESS_NOT_REQUESTED'
        ) {
          apiError.code = ApiError.NO_USER_PERMISSION; // dev needs to set correct permissions in ASK console
        }
        // skip catch
        return Promise.reject(apiError);
      }
      return response.data;
    } catch (e) {
      throw new ApiError('Something went wrong.', ApiError.ERROR);
    }
  }
}

export interface DeviceAddress {
  countryCode: string;
  postalCode: string;
}

export interface AlexaDeviceAddressPostalAndCountry extends DeviceAddress {}

export interface AlexaDeviceAddressFull extends DeviceAddress {
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  districtOrCounty: string;
  stateOrRegion: string;
  city: string;
}
