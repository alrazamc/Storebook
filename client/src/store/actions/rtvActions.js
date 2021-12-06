import axios from "axios";
import { showError, showSuccess } from './alertActions';
import { hideProgressBar, showProgressBar } from "./progressActions"

export const actionTypes = {
  RTVS_LOADED: 'rtvsLoaded',
  RTV_ADDED: 'rtvAdded',
  RTV_UPDATED: 'rtvUpdated',
  RTV_DELETED: 'rtvDeleted',
  EMPTY_RTVS: 'emptyRtvs',
  FILTERS_CHANGED: 'rtvsFiltersChanged'
}

export const addNewRtv = (storeId, rtv) => {
  return { type: actionTypes.RTV_ADDED, storeId, rtv }
}

export const loadRtvs = (recordsPerPage) => {
  return (dispatch, getState) => {
    const state = getState();
    const storeId = state.stores.selectedStoreId;
    let filters = {};
    let skip = 0;
    if(state.rtvs[storeId] && state.rtvs[storeId].filters)
      filters = state.rtvs[storeId].filters;
    if(state.rtvs[storeId] && state.rtvs[storeId].records)
      skip = state.rtvs[storeId].records.length;
    dispatch(showProgressBar());
    axios.post('/api/rtvs', { storeId, ...filters, skip, recordsPerPage} ).then( ({ data }) => {
      dispatch({ type: actionTypes.RTVS_LOADED, storeId, rtvs: data.rtvs, totalRecords: data.totalRecords });
      dispatch(hideProgressBar());
    }).catch( err => err );
  }
}

export const updateRtv = (storeId, rtvId, rtv) => {
  return { type: actionTypes.RTV_UPDATED, storeId, rtvId, rtv };
}

export const deleteRtv = (storeId, rtvId) => {
  return (dispatch, getState) => {
    dispatch(showProgressBar());
    axios.post('/api/rtvs/delete', { storeId, rtvId }).then( ({ data }) => {
      dispatch(hideProgressBar());
      dispatch( { type: actionTypes.RTV_DELETED, storeId, rtvId } );
      dispatch( showSuccess('RTV deleted') );
    }).catch( err => {
      dispatch( hideProgressBar() );
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    } );
  }
}

export const changeFilters = (storeId, filters) => {
  return { type: actionTypes.FILTERS_CHANGED, storeId, filters }
}

export const emptyRtvs = (storeId) => {
  return { type: actionTypes.EMPTY_RTVS, storeId }
}