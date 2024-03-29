import React, { useEffect, useMemo, useState } from 'react';
import { makeStyles, Button, Box, Typography, FormHelperText, IconButton } from '@material-ui/core'
import { change, Field, formValueSelector, initialize, reduxForm, SubmissionError } from 'redux-form';
import axios from 'axios';
import TextInput from '../../library/form/TextInput';
import { showProgressBar, hideProgressBar } from '../../../store/actions/progressActions';
import { connect } from 'react-redux';
import { showError, showSuccess } from '../../../store/actions/alertActions';
import { compose } from 'redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLongArrowAltLeft, faPrint } from '@fortawesome/free-solid-svg-icons';
import { Link, useHistory, useParams } from 'react-router-dom';
import RadioInput from '../../library/form/RadioInput';
import SelectInput from '../../library/form/SelectInput';
import { paymentModes } from '../../../utils/constants';
import { useSelector } from 'react-redux';
import DateTimeInput from '../../library/form/DateTimeInput';
import moment from 'moment';
import { updateCustomer } from '../../../store/actions/customerActions';
import { updateTxns } from '../../../store/actions/accountActions';
import CheckboxInput from '../../library/form/CheckboxInput';
import { allowOnlyPostiveNumber } from '../../../utils';
import ReactGA from "react-ga4";

const paymentModeOptions = [
  { id: paymentModes.PAYMENT_MODE_CASH, title: "Cash" },
  { id: paymentModes.PAYMENT_MODE_BANK, title: "Bank" },
]

const payReceiveTypes = [
  { id: -1, title: "Pay amount"},
  { id: 1, title: "Receive amount"},
]


const formName = 'editCustomerPayment';
const formSelector = formValueSelector(formName);

const useStyles = makeStyles(theme => ({
  box: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 'auto'
  },
  progress: {
    marginLeft: theme.spacing(1)
  },
  formError: {
    textAlign: "center"
  }
}));

function EditCustomerPayment(props) {
  const history = useHistory();
  const classes = useStyles();
  const { handleSubmit, pristine, storeId, submitSucceeded, submitting, error, invalid, dirty, dispatch, printTxn } = props;
  const { banks, defaultBankId, lastEndOfDay } = props;
  const [txn, setTxn] = useState({});
  const { customerId, txnId } = useParams();

  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: "/parties/customers/editpayment", 'title' : "Edit Customer Payment" });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    dispatch( showProgressBar() );
    axios.get('/api/customers/transaction', { signal: controller.signal, params: { storeId, customerId, txnId }}).then(({ data }) => {
      dispatch(hideProgressBar());
      if(data && data._id)
      {
        dispatch( initialize(formName, {
          time: moment(data.time).format("DD MMMM, YYYY hh:mm A"),
          type: data.bankId ? paymentModes.PAYMENT_MODE_BANK : paymentModes.PAYMENT_MODE_CASH, 
          payOrRecieve: data.amount > 0 ? -1 : 1,
          bankId: data.bankId ? data.bankId : defaultBankId,
          amount: Math.abs(data.amount),
          notes: data.notes 
        })  );
        setTxn(data);
      }
    }).catch(err => {
      dispatch(hideProgressBar());
      dispatch( showError( err.response && err.response.data.message ? err.response.data.message: err.message ) );
      history.push('/parties/customers');
    })
    return () => controller.abort()
  }, [customerId, txnId, dispatch, storeId, defaultBankId, history]);

  const customer = useSelector( state =>  state.customers[storeId].find(item => item._id === customerId) );

  const type = useSelector(state => formSelector(state, 'type'));

  const bankOptions = useMemo(() => {
    return banks.map(bank => ({ id: bank._id, title: bank.name }) );
  }, [banks]);

  useEffect(() => {
    dispatch( change(formName, 'bankId', defaultBankId) );
  }, [defaultBankId, dispatch]);

  useEffect(() => {
    if(submitSucceeded)
      history.push(`/parties/customers/ledger/${storeId}/${customerId}`);
  }, [submitSucceeded, history, storeId, customerId])
    return(
      <>
      <Box width="100%" justifyContent="flex-end" display="flex">
        <Button disableElevation color="primary" startIcon={<FontAwesomeIcon icon={faLongArrowAltLeft} />} component={Link} to={`/parties/customers/ledger/${storeId}/${customerId}`}>          
          {customer.name } Ledger
        </Button>
      </Box>
      <Box margin="auto" width={{ xs: '100%', md: '70%', xl: '50%' }}>
        <Typography gutterBottom variant="h6" align="center">Update Customer Transaction: { customer.name }</Typography>
        <Box display="flex" justifyContent="between">
          <Box width={{ xs: '100%', md: '50%' }}>
            <Typography gutterBottom variant="h6">Ledger Details</Typography>
            <Box display="flex" justifyContent="between" flexWrap="wrap">
              <Box width="60%"><Typography gutterBottom>Opening Balance: </Typography></Box>
              <Box width="40%"><Typography gutterBottom><b>{ customer.openingBalance.toLocaleString() }</b> </Typography></Box>

              <Box width="60%"><Typography gutterBottom>Total Sales: </Typography></Box>
              <Box width="40%"><Typography gutterBottom><b>{ customer.totalSales.toLocaleString() }</b> </Typography></Box>

              <Box width="60%"><Typography gutterBottom>Total Returns: </Typography></Box>
              <Box width="40%"><Typography gutterBottom><b>{ customer.totalReturns.toLocaleString() }</b> </Typography></Box>

              <Box width="60%"><Typography gutterBottom>Total Amount Paid: </Typography></Box>
              <Box width="40%"><Typography gutterBottom><b>{ customer.totalPayment.toLocaleString() }</b> </Typography></Box>

              <Box width="60%"><Typography gutterBottom>Net Receivable: </Typography></Box>
              <Box width="40%"><Typography gutterBottom><b>{ customer.currentBalance.toLocaleString() }</b> </Typography></Box>
            </Box>
            
          </Box>
          <Box width={{ xs: '100%', md: '50%' }}>
            <form onSubmit={handleSubmit}>
              <Box textAlign="center" mb={2}>
                <Field
                  component={DateTimeInput}
                  label="Transaction Time"
                  name="time"
                  dateFormat="DD MMMM, YYYY hh:mm A"
                  fullWidth={true}
                  inputVariant="outlined"
                  margin="dense"
                  emptyLabel=""
                  minDate={ moment(lastEndOfDay).toDate() }
                  maxDate={ moment().toDate() }
                  showTodayButton
                />  
              </Box>
              
              
              <Box textAlign="center">
                <Field
                  component={RadioInput}
                  options={paymentModeOptions}
                  label="Mode"
                  id="type"
                  name="type"
                />
              </Box>

              <Box textAlign="center" mb={2} width="100%">
                <Field
                  component={RadioInput}
                  options={payReceiveTypes}
                  name="payOrRecieve"
                  variant="outlined"
                  margin="dense"
                />
              </Box>

              {
                parseInt(type) === paymentModes.PAYMENT_MODE_BANK ?
                <Box>
                  <Field
                    component={SelectInput}
                    options={bankOptions}
                    name="bankId"
                    fullWidth={true}
                    variant="outlined"
                    margin="dense"
                  />
                </Box>
                : null
              }
              <Box>
                <Field
                component={TextInput}
                id="amount"
                name="amount"
                label="Amount"
                placeholder="Amount..."
                fullWidth={true}
                variant="outlined"
                margin="dense"
                onKeyDown={allowOnlyPostiveNumber}
                />    
              </Box>

              <Box>
                <Field
                  component={TextInput}
                  id="notes"
                  name="notes"
                  label="Notes"
                  placeholder="Notes..."
                  type="text"
                  fullWidth={true}
                  variant="outlined"
                  multiline
                  rows={3}
                  margin="dense"
                />
              </Box>

              <Box textAlign="center">
                <Field
                  component={CheckboxInput}
                  name="printTxn"
                  label="Print Transaction Receipt"
                  fullWidth={true}
                  disabled={!dirty}
                />
              </Box>

              
              
            <Box textAlign="center">
              <Button disableElevation type="submit" variant="contained" color="primary" disabled={pristine || submitting || invalid || !dirty} >
                Update Transaction
              </Button>
              {
                dirty ? null :
                <IconButton style={{ marginLeft: 8}} title="Print Receipt" onClick={ () => printTxn({ ...txn, customer}) } >
                  <FontAwesomeIcon icon={faPrint} size="xs" />
                </IconButton>
              }
              {  
                <FormHelperText className={classes.formError} error={true} style={{visibility: !submitting && error ? 'visible' : 'hidden' }}>
                  <Typography component="span">{ error ? error : 'invalid request' }</Typography>
                </FormHelperText>  
              }
            </Box>
            </form>
          </Box>
        </Box>
      </Box>
      </>
    )
}

const onSubmit = (values, dispatch, { storeId, match, printTxn }) => {
  dispatch(showProgressBar());
  return axios.post('/api/customers/updatePayment', {storeId, ...match.params, ...values, time: moment(values.time, "DD MMMM, YYYY hh:mm A").toDate()}).then( response => {
    dispatch(hideProgressBar());
    if(response.data.customer._id)
    {
      dispatch( updateCustomer(storeId, match.params.customerId, response.data.customer,  response.data.now, response.data.lastAction) );
      if(response.data.accountTxn._id)
        dispatch( updateTxns( storeId, response.data.accountTxn._id,  [response.data.accountTxn] ) );
      dispatch( showSuccess("Payment updated") );
      if(response.data.txn._id && values.printTxn)
        printTxn({ ...response.data.txn, customer: response.data.customer });
    }
  }).catch(err => {
    dispatch(hideProgressBar());
    throw new SubmissionError({
      _error: err.response && err.response.data.message ? err.response.data.message: err.message
    });
  });
}

const validate = (values, props) => {
  const { dirty, lastEndOfDay } = props;
  if(!dirty) return {};
  const errors = {};
  if(lastEndOfDay && moment(values.time, "DD MMMM, YYYY hh:mm A") <= moment(lastEndOfDay))
    errors.time = "Date & time should be after last day closing: " + moment(lastEndOfDay).format("DD MMMM, YYYY hh:mm A");
  else if(moment(values.time, "DD MMMM, YYYY hh:mm A") > moment())
    errors.time = "Date & time should not be after current time: " + moment().format("DD MMMM, YYYY hh:mm A"); 
  if(!values.amount || Number(values.amount) === 0)
    errors.amount = "Amount is required";
  else if(isNaN(Number(values.amount)))
    errors.amount = "invalid amount";
  return errors;
}

const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;
  const store = state.stores.stores.find(store => store._id === storeId);
  const banks = state.accounts.banks[storeId] ? state.accounts.banks[storeId] : [];
  const defaultBank = banks.find(bank => bank.default === true);
  return{
    storeId,
    banks,
    defaultBankId: defaultBank ? defaultBank._id : null,
    lastEndOfDay: store.lastEndOfDay
  }
}

export default compose(
connect(mapStateToProps),
reduxForm({
  'form': formName,
  validate,
  onSubmit
})
)(EditCustomerPayment);