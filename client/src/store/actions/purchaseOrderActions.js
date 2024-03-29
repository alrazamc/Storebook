import axios from "axios";
import { poStates } from "../../utils/constants";
import { showError, showSuccess } from './alertActions';
import { hideProgressBar, showProgressBar } from "./progressActions"

export const actionTypes = {
  PURCHASE_ORDERS_LOADED: 'purchaseOrdersLoaded',
  PURCHASE_ORDER_ADDED: 'purchaseOrderAdded',
  PURCHASE_ORDER_UPDATED: 'purchaseOrderUpdated',
  PURCHASE_ORDER_DELETED: 'purchaseOrderDeleted',
  EMPTY_PURCHASE_ORDERS: 'emptyPurchaseOrders',
  FILTERS_CHANGED: 'purchaseOrdersFiltersChanged',
  UPDATE_PO_DRAFT: 'updatePODraft'
}

export const addNewPO = (storeId, order) => {
  return { type: actionTypes.PURCHASE_ORDER_ADDED, storeId, order }
}

export const loadPurchaseOrders = (recordsPerPage) => {
  return (dispatch, getState) => {
    const state = getState();
    const storeId = state.stores.selectedStoreId;
    let filters = {};
    let skip = 0;
    if(state.purchaseOrders[storeId] && state.purchaseOrders[storeId].filters)
      filters = state.purchaseOrders[storeId].filters;
    if(state.purchaseOrders[storeId] && state.purchaseOrders[storeId].records)
      skip = state.purchaseOrders[storeId].records.length;
    dispatch(showProgressBar());
    axios.post('/api/purchaseOrders', { storeId, ...filters, skip, recordsPerPage} ).then( ({ data }) => {
      dispatch({ type: actionTypes.PURCHASE_ORDERS_LOADED, storeId, orders: data.orders, totalRecords: data.totalRecords });
      dispatch(hideProgressBar());
    }).catch( err => {
      dispatch({ type: actionTypes.PURCHASE_ORDERS_LOADED, storeId, orders: [], totalRecords: 0 });
      dispatch(hideProgressBar());
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    } );
  }
}

export const openPurchaseOrder = (poId) => {
  return (dispatch, getState) => {
    const state = getState();
    const storeId = state.stores.selectedStoreId;
    let records = [];
    if(state.purchaseOrders[storeId] && state.purchaseOrders[storeId].records)
      records = state.purchaseOrders[storeId].records;
    let order = records.find(record => record._id === poId);
    if(!order) return;
    dispatch( { type: actionTypes.PURCHASE_ORDER_UPDATED, storeId, poId, order: {...order, status: poStates.PO_STATUS_OPEN} } );
  }
}

export const closePurchaseOrder = (poId) => {
  return (dispatch, getState) => {
    const state = getState();
    const storeId = state.stores.selectedStoreId;
    let records = [];
    if(state.purchaseOrders[storeId] && state.purchaseOrders[storeId].records)
      records = state.purchaseOrders[storeId].records;
    let order = records.find(record => record._id === poId);
    if(!order) return;
    dispatch( { type: actionTypes.PURCHASE_ORDER_UPDATED, storeId, poId, order: {...order, status: poStates.PO_STATUS_CLOSED} } );
  }
}

export const updatePO = (storeId, poId, order) => {
  return { type: actionTypes.PURCHASE_ORDER_UPDATED, storeId, poId, order };
}

export const deletePurchaseOrder = (storeId, poId) => {
  return (dispatch, getState) => {
    dispatch(showProgressBar());
    axios.post('/api/purchaseOrders/delete', { storeId, poId }).then( ({ data }) => {
      dispatch(hideProgressBar());
      dispatch( { type: actionTypes.PURCHASE_ORDER_DELETED, storeId, poId } );
      dispatch( showSuccess('Purchase Order deleted') );
    }).catch( err => {
      dispatch( hideProgressBar() );
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    } );
  }
}

export const changeFilters = (storeId, filters) => {
  return { type: actionTypes.FILTERS_CHANGED, storeId, filters }
}

export const emptyPurchaseOrders = (storeId) => {
  return { type: actionTypes.EMPTY_PURCHASE_ORDERS, storeId }
}

export const updatePoDraft = (storeId, draft) => {
  return { type: actionTypes.UPDATE_PO_DRAFT, storeId, draft }
}