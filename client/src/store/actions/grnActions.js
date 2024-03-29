import axios from "axios";
import { showError, showSuccess } from './alertActions';
import { hideProgressBar, showProgressBar } from "./progressActions"
import { updateSupplier } from "./supplierActions";
import { actionTypes as accountActions } from "./accountActions";
import { openPurchaseOrder } from "./purchaseOrderActions";
import { itemsStampChanged, syncItems } from "./itemActions";

export const actionTypes = {
  GRNS_LOADED: 'grnsLoaded',
  GRN_ADDED: 'grnAdded',
  GRN_UPDATED: 'grnUpdated',
  GRN_DELETED: 'grnDeleted',
  EMPTY_GRNS: 'emptyGrns',
  FILTERS_CHANGED: 'grnsFiltersChanged',
  UPDATE_GRN_DRAFT: 'updateGRNDraft'
}

export const addNewGrn = (storeId, grn) => {
  return { type: actionTypes.GRN_ADDED, storeId, grn }
}

export const loadGrns = (recordsPerPage) => {
  return (dispatch, getState) => {
    const state = getState();
    const storeId = state.stores.selectedStoreId;
    let filters = {};
    let skip = 0;
    if(state.grns[storeId] && state.grns[storeId].filters)
      filters = state.grns[storeId].filters;
    if(state.grns[storeId] && state.grns[storeId].records)
      skip = state.grns[storeId].records.length;
    dispatch(showProgressBar());
    axios.post('/api/grns', { storeId, ...filters, skip, recordsPerPage} ).then( ({ data }) => {
      dispatch({ type: actionTypes.GRNS_LOADED, storeId, grns: data.grns, totalRecords: data.totalRecords });
      dispatch(hideProgressBar());
    }).catch( err => {
      dispatch({ type: actionTypes.GRNS_LOADED, storeId, grns: [], totalRecords: 0 });
      dispatch( hideProgressBar() );
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    });
  }
}

export const updateGrn = (storeId, grnId, grn) => {
  return { type: actionTypes.GRN_UPDATED, storeId, grnId, grn };
}

export const deleteGrn = (storeId, grnId, poId) => {
  return (dispatch, getState) => {
    const state = getState();
    const itemsLastUpdatedOn = state.system.lastUpdatedStamps[storeId] ? state.system.lastUpdatedStamps[storeId].items : null;
    dispatch(showProgressBar());
    axios.post('/api/grns/delete', { storeId, grnId }).then( ({ data }) => {
      dispatch(hideProgressBar());
      dispatch( { type: actionTypes.GRN_DELETED, storeId, grnId } );
      if(data.now)
      {
        dispatch( syncItems(itemsLastUpdatedOn) );
        dispatch( itemsStampChanged(storeId, data.now) );
      }
      if(data.supplier)
        dispatch( updateSupplier(storeId, data.supplier._id, data.supplier, data.now, data.lastAction) );
      if(data.accountTxnId)
        dispatch( { type: accountActions.TRANSACTION_DELETED, storeId, txnId: data.accountTxnId } );
      if(poId)
        dispatch( openPurchaseOrder(poId) );
      dispatch( showSuccess('GRN deleted') );
    }).catch( err => {
      dispatch( hideProgressBar() );
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    } );
  }
}

export const changeFilters = (storeId, filters) => {
  return { type: actionTypes.FILTERS_CHANGED, storeId, filters }
}

export const emptyGrns = (storeId) => {
  return { type: actionTypes.EMPTY_GRNS, storeId }
}

export const updateGrnDraft = (storeId, draft) => {
  return { type: actionTypes.UPDATE_GRN_DRAFT, storeId, draft }
}