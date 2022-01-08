import React, { useMemo, useRef } from 'react'
import { Box, Button, IconButton, InputAdornment, Typography, FormHelperText } from '@material-ui/core';
import ItemPicker from '../../library/ItemPicker';
import { useState } from 'react';
import { useCallback } from 'react';
import { change, Field, formValueSelector, getFormValues, initialize, reduxForm } from 'redux-form';
import { allowOnlyNumber } from '../../../utils';
import TextInput from '../../library/form/TextInput';
import DateTimeInput from '../../library/form/DateTimeInput';
import moment from 'moment';
import { useEffect } from 'react';
import { compose } from 'redux';
import { connect, useSelector } from 'react-redux';
import SelectCustomer from './SelectCustomer';
import ItemsGrid from './ItemsGrid';
import Cart from './Cart';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faMoneyBillWaveAlt, faPlus, faPrint, faTimes, faTrash, faTrashRestore } from '@fortawesome/free-solid-svg-icons';
import { showError, showSuccess } from 'store/actions/alertActions';
import { addOfflineSale, updateSale } from 'store/actions/saleActions';
import Payment from './Payment';
import { hideProgressBar, showProgressBar } from 'store/actions/progressActions';
import { updateStore } from 'store/actions/storeActions';
import { actionTypes as customerTypes, updateCustomer } from 'store/actions/customerActions';
import { Redirect, useHistory, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import { emptyTxns } from 'store/actions/accountActions';

const formName = "saleAndReturn";

const mergeItemBatchesWithSaleBatches = (itemBatches, saleBatches, packQuantity) => {
  let newBatches = Array.isArray(itemBatches) ? [...itemBatches] : [];
  if(!Array.isArray(saleBatches) || saleBatches.length === 0) return newBatches;
  saleBatches.forEach(rtvBatch => {
    if(!rtvBatch.batchNumber || rtvBatch.batchQuantity === 0) return;
    let batchExist = newBatches.find(record => record.batchNumber.toLowerCase() === rtvBatch.batchNumber.toLowerCase());
    let batchQuantity = Number(packQuantity) * Number(rtvBatch.batchQuantity); //packQuantity = 1 in case of non-pack
    if(batchExist)
    {
      batchExist.batchStock = +(batchExist.batchStock + batchQuantity).toFixed(2);
      newBatches = newBatches.map( record => record.batchNumber.toLowerCase() === rtvBatch.batchNumber.toLowerCase() ? batchExist :  record);
    }else
    {
      newBatches.push({
        batchNumber: rtvBatch.batchNumber,
        batchExpiryDate: rtvBatch.batchExpiryDate,
        batchStock: +batchQuantity.toFixed(2)
      });
    }
  });
  return newBatches;
}

function SaleAndReturn(props){
  const { storeId, store, userId, lastEndOfDay, dispatch, defaultBankId, pristine, submitting, invalid, dirty, error, handleSubmit, banks, printSalesReceipt, printSale, online } = props;
  const allItems = useSelector(state => state.items[storeId].allItems );
  const { saleId } = useParams();
  const sale = useSelector(state => saleId ? state.sales[storeId].records.find(record => record._id === saleId) : null);
  
  const refreshTimeInterval = useRef();
  const [items, setItems] = useState([]);
  const location = useLocation();
  const history = useHistory();


  //reset form to init values
  const resetSale = useCallback(() => {
    if(location.pathname !== '/sale')
    {
      return history.push('/sale');
    }
    setItems([]);
    dispatch(initialize(formName, {
      saleDate: moment().toDate(),
      userId,
      quantity: 1,
      adjustment: 0,
      cashPaid: 0,
      bankAmount: 0,
      creditAmount: 0,
      bankId: defaultBankId,
      items: {}
    }
    ));
  }, [dispatch, defaultBankId, userId, location.pathname, history]);

  //init form on page load
  useEffect(() => {
    if(!sale) return resetSale();

    let formItems = {};
    sale.items.forEach(item => {
      let batches = [];
      item.batches.forEach( (batch, index) => {
        if(!batch.batchNumber) return;
        if(item.quantity < 0)
          batches.push({
            batchNumber: batch.batchNumber,
            batchQuantity: batch.batchQuantity,
            batchExpiryDate: batch.batchExpiryDate
          })
        else
        batches.push({
          batchNumber: `${batch.batchNumber}----${batch.batchExpiryDate}`,
          batchExpiryDate: null,
          batchQuantity: batch.batchQuantity
        });
      })
      if(item.batches.length === 0)
       batches.push({
         batchNumber: 0,
         batchExpiryDate: null,
         batchQuantity: 0
       });
      formItems[item._id] = {...item, batches};
    })
    
    let selectedItems = [];
    sale.items.forEach(item => {
      let storeItem = allItems.find(record => record._id === item._id);
      if(storeItem)
      {
        let { _id, itemName, itemCode, sizeCode, sizeName, combinationCode, combinationName, salePrice, packParentId, packQuantity, currentStock, packSalePrice, isServiceItem } = storeItem;
        let unitQuantity = packParentId ? packQuantity * item.quantity : item.quantity;
        let originalBatches = mergeItemBatchesWithSaleBatches(storeItem.batches, item.batches, storeItem.packParentId ? storeItem.packQuantity : 1 );
        let newItem = { _id, itemName, itemCode, sizeCode, sizeName, combinationCode, combinationName, salePrice, packParentId, packQuantity, packSalePrice, quantity: item.quantity, batches: originalBatches };
        formItems[item._id] = { ...formItems[item._id], packParentId, currentStock: currentStock + unitQuantity, packQuantity, isServiceItem, sourceBatches: originalBatches};
        selectedItems.push(newItem);
      }
    });
    dispatch(initialize(formName, { ...sale, quantity: 1, bankId: sale.bankId ? sale.bankId: defaultBankId, items: formItems, saleDate: moment(sale.saleDate).format("DD MMMM, YYYY hh:mm A") }));
    setItems(selectedItems);

  }, [resetSale, sale, allItems, dispatch, defaultBankId]);

  //get form data
  const formValues = useSelector(state => {
    let formData = getFormValues(formName)(state);
    if(formData)
      return !formData.items ? { ...formData, items: []} : formData;
    else
      return { items: [] }
  });

  const disableEdit = useMemo(() => {
    if(sale && sale.isVoided) return true;
    if(sale && lastEndOfDay && moment(sale.saleDate) <= moment(lastEndOfDay))
      return true;
    return false;
  }, [lastEndOfDay, sale]);

  const customer = useSelector(state => formValues.customerId ? state.customers[storeId].find(record => record._id === formValues.customerId) : null);

  //refresh sale time if it's pristine
  useEffect(() => {
    if(saleId) return;
    if(items.length && refreshTimeInterval.current)
    {
      clearInterval(refreshTimeInterval.current);
      return;
    }
    refreshTimeInterval.current = setInterval(() => {
      if(saleId || items.length) return;
      dispatch( change(formName, 'saleDate', moment().toDate()) );
    }, 1000 * 60)
    return () => {
      if(refreshTimeInterval.current)
        clearInterval(refreshTimeInterval.current);
    }
  }, [dispatch, saleId, items.length]);

  const formItems = formValues.items;

  //plus/minus adjustment
  const adjustment = useSelector(state => formValueSelector(formName)(state, 'adjustment'));
  const toggleAdjustment = useCallback(() => {
    if(Number(adjustment) === 0) return;
    dispatch( change(formName, `adjustment`, -1 * Number(adjustment) ) );
  }, [adjustment, dispatch]);
  
  //pass to item Picker
  const selectItem = useCallback((item) => {
    let isExist = items.find(record => record._id === item._id);
    if(isExist)
    {
      dispatch( change(formName, `items[${item._id}].quantity`, Number(formItems[item._id].quantity) + 1));
    }else
    {
      let { _id, itemName, itemCode, sizeCode, sizeName, combinationCode, combinationName, salePrice, packParentId, packQuantity, currentStock, packSalePrice, batches, isServiceItem } = item;
      let newItem = { _id, itemName, itemCode, sizeCode, sizeName, combinationCode, combinationName, salePrice, packParentId, packQuantity, packSalePrice, quantity: 1, batches };
      dispatch( change(formName, `items[${_id}]`, {_id, quantity: 1, salePrice: packParentId ? packSalePrice : salePrice, discount: 0, packParentId, currentStock, packQuantity, isServiceItem, isVoided: false, batches:[{ batchNumber: 0, batchExpiryDate: null, batchQuantity: 0 }], sourceBatches: batches }));
      setItems([
        ...items,
        newItem,
      ]);
    }
  }, [items, formItems, dispatch]);

  //Pass to item Picker, or delete item from list
  const removeItem = useCallback((item) => {
    
  }, []);

  const totalAmount = useMemo(() => {
    let totalAmount = 0;
    items.forEach(record => {
      let item = formItems[record._id];
      if(!item || item.isVoided) return;
      let quantity = isNaN(item.quantity) ? 0 :  Number(item.quantity);

      let salePrice = isNaN(item.salePrice) ? 0 :  Number(item.salePrice);

      let discount = isNaN(item.discount) ? 0 :  quantity * Number(item.discount);
      totalAmount += salePrice * quantity;
      totalAmount -= discount;
    });
    totalAmount = totalAmount + ( isNaN(adjustment) ? 0 :  Number(adjustment) );
    return +totalAmount.toFixed(2);
  }, [formItems, items, adjustment]);

  const totalQuantity = useMemo(() => {
    let total = 0;
    for(let key in formItems)
    {
      let item = formItems[key];
      if(!item || item.isVoided) continue;
      if(isNaN(item.quantity))
        total += 0
      else
        total += Number(item.quantity);
    }
    return (+total.toFixed(2)).toLocaleString()
  }, [formItems]);

  const onSubmit = useCallback((formData, dispatch, { storeId, store }) => {
    const payload = {storeId, ...formData};
    payload.saleNumber = store.idsCursors.saleCursor;
    payload.saleDate = moment(formData.saleDate, "DD MMMM, YYYY hh:mm A").toDate();
    payload.creationDate = moment().toDate();
    payload.lastUpdated = moment().toDate();
    payload.isSynced = false;
    payload.isVoided = false;
    payload.items = [];
    items.forEach(item => {
      let record = formData.items[item._id];
      if(!record) return;
      let {_id, quantity, salePrice, discount, isVoided, batches } = record;
      payload.items.push({_id, quantity, salePrice, discount, isVoided, batches });
    });
    dispatch( showProgressBar() );
    dispatch( addOfflineSale(storeId, payload) );
    dispatch( updateStore(storeId, { ...store, idsCursors: { ...store.idsCursors, saleCursor: store.idsCursors.saleCursor + 1 } }) ); //update store cursor
    if(payload.customerId && Number(payload.creditAmount) !== 0 && customer)
      dispatch( { type: customerTypes.CUSTOMER_UPDATED, storeId, customerId: payload.customerId, customer: { ...customer, currentBalance: customer.currentBalance + Number(payload.creditAmount) } } );

    setTimeout(() => {
      dispatch( hideProgressBar() );
      dispatch( showSuccess("New sale added") );
      resetSale();
      if(printSalesReceipt)
        printSale({ ...payload, printSalesReceipt })
    }, 500);
    
  }, [items, resetSale, printSalesReceipt, printSale, customer]);

  const toggleVoid = useCallback(() => {
    if(!sale) return;
    dispatch(showProgressBar());
    axios.post('/api/sales/toggleVoid', { storeId, saleId: sale._id }).then( ({ data }) => {
      dispatch(hideProgressBar());
      if(data.sale)
      {
        dispatch( updateSale(storeId, sale._id, data.sale) );
      }
      if(data.customer)
        dispatch( updateCustomer(storeId, data.customer._id, data.customer, data.now, data.lastAction) );

      dispatch( emptyTxns(storeId) );

      dispatch( showSuccess(`Sale ${!sale.isVoided ? "voided" : "unvoided"}`) );
      resetSale();
    }).catch( err => {
      dispatch( hideProgressBar() );
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    });
  }, [sale, dispatch, storeId, resetSale]);

  const editSale = useCallback(() => {
    if(!sale) return;

    const payload = {storeId, ...formValues};
    payload.saleId = sale._id;
    payload.saleDate = moment(formValues.saleDate, "DD MMMM, YYYY hh:mm A").toDate();
    payload.items = [];
    items.forEach(item => {
      let record = formValues.items[item._id];
      if(!record) return;
      let {_id, quantity, salePrice, discount, isVoided, batches } = record;
      payload.items.push({_id, quantity, salePrice, discount, isVoided, batches });
    });

    dispatch(showProgressBar());
    axios.post('/api/sales/update', payload).then( ({ data }) => {
      dispatch(hideProgressBar());
      if(data.sale)
      {
        dispatch( updateSale(storeId, sale._id, data.sale) );
      }
      if(data.customer)
        dispatch( updateCustomer(storeId, data.customer._id, data.customer, data.now, data.lastAction) );

      dispatch( emptyTxns(storeId) );

      dispatch( showSuccess('Sale updated') );
      resetSale();

    }).catch( err => {
      dispatch( hideProgressBar() );
      dispatch(showError( err.response && err.response.data.message ? err.response.data.message: err.message ));
    });
  }, [sale, dispatch, storeId, resetSale, formValues, items]);
  if(saleId && !sale)
  {
    dispatch( showError("Sale not found") );
    return <Redirect to="/sale" />
  }
  return(
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box display="flex" justifyContent="space-between" alignItems="center" borderBottom="2px solid #ececec" pb={1} mb={1}>
        <Box width={{ xs: '100%', md: '48%' }}>
          <Field
          component={DateTimeInput}
          name="saleDate"
          label="Date"
          dateFormat="DD MMMM, YYYY hh:mm A"
          placeholder="Date..."
          fullWidth={true}
          inputVariant="outlined"
          margin="dense"
          emptyLabel=""
          minDate={ moment(lastEndOfDay).toDate() }
          maxDate={ moment().toDate() }
          showTodayButton
          disabled={disableEdit}
          />    
        </Box>
        <Box width={{ xs: '100%', md: '48%' }}>
          <Field
            component={SelectCustomer}
            formName={formName}
            name="customerId"
            disabled={disableEdit}
            addNewRecord={online}
          />
        </Box>
      </Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box width={{ xs: "100%", md: "48%" }}>
          <Box style={{ backgroundColor: "#f9f9f9" }} border="1px solid #ececec" borderRadius={5}>
            <Box  style={{ backgroundColor: "#fff" }} display="flex" justifyContent="space-between" borderBottom="1px solid #ececec" flexWrap="wrap" alignItems="center" px={2} py={0} >
              <Box style={{ width: '70px' }}>
                <Field
                  component={TextInput}
                  label="Qty"
                  name="quantity"
                  placeholder="Qty..."
                  fullWidth={true}
                  variant="outlined"
                  margin="dense"
                  type="text"
                  showError={false}
                  onKeyDown={allowOnlyNumber}
                  addNewRecord={true}
                  disabled={disableEdit}
                />
              </Box>
              <Box style={{ flexGrow: 1 }}>
                <ItemPicker disabled={disableEdit} {...{selectItem, removeItem, selectedItems: items, showServiceItems: true, autoFocus: true}} />
              </Box>
            </Box>
            <ItemsGrid disabled={disableEdit} selectItem={selectItem}  />
          </Box>
          <Box>
            <Field
              component={TextInput}
              name="notes"
              label="Notes"
              placeholder="Notes..."
              type="text"
              fullWidth={true}
              variant="outlined"
              multiline
              rows={2}
              margin="dense"
              disabled={disableEdit}
              showError={false}
            />
          </Box>
          <Box>
            {
              sale && lastEndOfDay && moment(sale.saleDate) <= moment(lastEndOfDay) ?
              <Typography component="div" style={{ color: '#7c7c7c', fontSize: 12 }}>Cannot update this sale because it is dated before Last end of Day: { moment(lastEndOfDay).format("DD MMM, YYYY, hh:mm A") }</Typography>
              : null
            }
            {
              sale && sale.isVoided ?
              <Typography component="div" style={{ color: '#7c7c7c' }}>Cannot update voided sale, Unvoid it to update</Typography>
              : null
            }
            {
              Boolean(error) ? 
              <FormHelperText error={true} >
                {error}
              </FormHelperText>
              : null
            }
          </Box>
        </Box>
        <Box width={{ xs: "100%", md: "48%" }}>

          <Cart items={items} formItems={formItems} formName={formName} allowNegativeInventory={store.configuration.allowNegativeInventory} sale={sale} disabled={disableEdit} />
          
          <Box display="flex" justifyContent="space-between">
            <Box width={{xs: "100%", md: "45%"}}>
              <Field
                component={TextInput}
                label="Adjustment"
                name="adjustment"
                fullWidth={true}
                variant="outlined"
                margin="dense"
                type="text"
                showError={false}
                onKeyDown={allowOnlyNumber}
                addNewRecord={true}
                inputProps={{ style:{ textAlign: "right" } }}
                disabled={disableEdit}
                InputProps={{
                    startAdornment:
                      <InputAdornment position="start">
                        <IconButton
                          onClick={() => toggleAdjustment()}
                          onMouseDown={(event) => event.preventDefault()}
                        >
                          { <FontAwesomeIcon icon={ Number(adjustment) <= 0  ? faPlus : faMinus } size="xs" /> }
                        </IconButton>
                      </InputAdornment>
                    }
                  }
              />
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Total</Typography>
                <Typography variant="h4">{totalAmount.toLocaleString()}</Typography>
              </Box>
            </Box>
            <Box width={{xs: "100%", md: "53%"}} >
              <Box display="flex" justifyContent="space-between" flexWrap="wrap" pt={1}>
                <Payment {...{ pristine, sale, submitting, invalid, dirty, totalQuantity, totalAmount, formName, banks, storeId, handleSubmit, onSubmit, editSale, disableEdit }} />
                {
                   sale ?
                   <Button variant="outlined" color="primary" disabled={dirty} onClick={() => printSale(sale)} title="Print Receipt" type="button" startIcon={<FontAwesomeIcon icon={faPrint} />} >Print</Button>
                   :
                   <Button variant="outlined" color="primary" disabled={pristine || submitting || invalid || !dirty || Number(totalQuantity) === 0 || disableEdit} type="submit" startIcon={<FontAwesomeIcon icon={faMoneyBillWaveAlt} />} >Cash</Button>
                }                
              </Box>
              <Box display="flex" justifyContent={ sale ? "space-between" : "flex-end" } flexWrap="wrap" pt={1}>
                {
                  !sale ? null : 
                  <Button variant="contained" color="primary" disabled={dirty || ( lastEndOfDay && moment(sale.saleDate) <= moment(lastEndOfDay) )} type="button" onClick={toggleVoid} startIcon={<FontAwesomeIcon icon={sale.isVoided ? faTrashRestore : faTrash} />} >{ sale.isVoided ? "Unvoid" : "Void" }</Button>
                }
                <Button variant="contained" color="primary" type="button" disabled={items.length === 0}  startIcon={<FontAwesomeIcon icon={faTimes} />} onClick={resetSale}>Cancel</Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </form>
  )
}

const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;
  const store = state.stores.stores.find(store => store._id === storeId);
  const banks = state.accounts.banks[storeId] ? state.accounts.banks[storeId] : [];
  const defaultBank = banks.find(bank => bank.default === true);
  return{
    storeId,
    store: store,
    userId: state.auth.uid,
    printSalesReceipt: store.receiptSettings.printSalesReceipt,
    banks: banks.map(bank => ({ id: bank._id, title: bank.name }) ),
    defaultBankId: defaultBank ? defaultBank._id : null,
    lastEndOfDay: store.lastEndOfDay,
    online: state.system.online
  }
}

const validate = (values, props) => {
  const { dirty, lastEndOfDay, store } = props;
  if(!dirty) return {};
  const errors = { items: {} };

  if(lastEndOfDay && moment(values.saleDate, "DD MMMM, YYYY hh:mm A") <= moment(lastEndOfDay))
    errors.saleDate = "Date & time should be after last day closing: " + moment(lastEndOfDay).format("DD MMMM, YYYY hh:mm A");
  else if(moment(values.saleDate, "DD MMMM, YYYY hh:mm A") > moment())
    errors.saleDate = "Date & time should not be after current time: " + moment().format("DD MMMM, YYYY hh:mm A");

  for(let itemId in values.items)
  {
    if(values.items[itemId] === undefined || values.items[itemId].isVoided) continue;
    errors.items[itemId] = { batches: {} };
    let quantity = Number(values.items[itemId].quantity);
    if( !quantity ) continue;
    
    if(!(values.items[itemId].isServiceItem))
    {
      let totalQuantity = values.items[itemId].packParentId ? Number(values.items[itemId].packQuantity) * quantity : quantity;
      if(!(store.configuration.allowNegativeInventory) && totalQuantity > 0 && totalQuantity > Number(values.items[itemId].currentStock))
        errors.items[itemId].quantity = `Quantity(${totalQuantity}) should not be greater than available stock(${Number(values.items[itemId].currentStock)})`;
    }
    
    let batchQuantity = 0;
    let batchCount = 0;
    values.items[itemId].batches.forEach((batch, index) => {
      if(!batch.batchNumber) return;
      if(!Number(batch.batchQuantity)) errors.items[itemId].batches._error = "Batch quantity is required";
      if(quantity < 0 && !batch.batchExpiryDate) errors.items[itemId].batches._error = "Expiry date is required"; //when returning expiry date is required
      batchCount++;
      batchQuantity += Number(batch.batchQuantity);
    });
    if(batchCount && batchQuantity !== Math.abs(quantity) && !errors.items[itemId].batches._error) //batches applied but quantity doesn't match
      errors.items[itemId].batches._error = "Sum of batch quantities should be equal to total quantity";
    if(quantity < 0 && values.items[itemId].sourceBatches.length > 0 && batchCount === 0) //return, source batches exist no batches specified
    {
      errors.items[itemId].batches._error = "Please enter batch details for return item";
      errors._error = "Please enter batch details for return item";
    } 
  }
  return errors;
}

export default compose(
  connect(mapStateToProps),
  reduxForm({
    form: formName,
    validate
  })
)(SaleAndReturn);