import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { reduxForm, Field, SubmissionError, initialize } from 'redux-form';
import { Box, makeStyles, Button, FormHelperText } from '@material-ui/core';
import FormMessage from '../library/FormMessage';
import TextInput from '../library/form/TextInput';
import {  storesStampChanged, updateStore } from '../../store/actions/storeActions';
import axios from 'axios';
import { showProgressBar, hideProgressBar } from '../../store/actions/progressActions';
import SwitchInput from '../library/form/SwitchInput';
import { showSuccess } from '../../store/actions/alertActions';
import ReactGA from "react-ga4";
import UploadFile from 'components/library/UploadFile';


const useStyles = makeStyles(theme => ({
  paper:{
    width: '100%',
    [theme.breakpoints.up('md')]:{
      width: '70%',
      margin: 'auto'
    }
  },
  button: {
    margin: theme.spacing(1)
  }
}));

const Receipt = (props) => {
  const classes = useStyles();
  const { handleSubmit, pristine, submitting, error, invalid, selectedStoreId } = props;
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: "/store-settings/receipt", 'title' : "Receipt Settings" });
  }, []);
  return (
    <Box width={{ xs: '100%', md: '50%' }} >
      <form onSubmit={handleSubmit} >
        <Box mb={2} width={{ xs: '100%', md: '50%' }} margin="auto" >
          <Field component={SwitchInput} name="printSalesReceipt" label="Print Sales Receipt" />    
        </Box>

        <Box mb={2} width={{ xs: '100%', md: '50%' }} margin="auto" >
          <Field component={SwitchInput} name="printLogo" label="Print Logo" />    
        </Box>

        <Box mb={2} width={{ xs: '100%', md: '50%' }} margin="auto" >
          <Field component={SwitchInput} name="printSaleId" label="Print Receipt ID" />    
        </Box>

        <Box mb={2}width={{ xs: '100%', md: '50%' }} margin="auto" >
          <Field component={SwitchInput} name="printSalesperson" label="Print Salesperson" />    
        </Box>

        <Box mb={2}width={{ xs: '100%', md: '50%' }} margin="auto" >
          <Field component={SwitchInput} name="printCustomerName" label="Print Customer name" />    
        </Box>

        <Box mb={2} width={{ xs: '100%', md: '50%' }} margin="auto" >
          <Field component={SwitchInput} name="printSaleNotes" label="Print Sale Notes" />    
        </Box>

        <Box mb={2} width={{ xs: '100%', md: '50%' }} margin="auto" >
          <Field component={SwitchInput} name="printItemName" label="Print Item Name" />    
        </Box>

        <Box mb={2} width={{ xs: '100%', md: '50%' }} margin="auto" >
          <Field component={SwitchInput} name="printItemCode" label="Print Item Code" />    
        </Box>

        <Box mb={2} width={{ xs: '100%', md: '50%' }} margin="auto" >
          <Field component={SwitchInput} name="printCustomerLedger" label="Print Customer Ledger" />    
        </Box>

        <Box>
          <Field
          component={TextInput}
          id="receiptTitle"
          name="receiptTitle"
          label="Receipt Title"
          placeholder="Receipt Title"
          fullWidth={true}
          variant="outlined"
          margin="dense"
          />    
        </Box>

        <Box>
          <Field
          component={TextInput}
          id="footer"
          name="footer"
          label="Footer"
          placeholder="Receipt footer"
          fullWidth={true}
          variant="outlined"
          margin="dense"
          multiline={true}
          rows={3}
          />    
        </Box>

        <Box>
          <FormHelperText>
            Recommended black & white png logo with transparent background having dimesions 200px X 65px
          </FormHelperText>
          <Field
            component={UploadFile}
            label="Upload Logo"
            resize={false}
            storeId={selectedStoreId}
            name="logo"
            filePath="receipt/"
          />
        </Box>

        <Box display="flex" alignItems="center" justifyContent="center" flexDirection="column"> 
          <Button disableElevation type="submit" variant="contained" color="primary" disabled={pristine || submitting || invalid} className={classes.button}>
            Update
          </Button>
        </Box>
        { error && 
            <FormMessage error={true} >
            { error }
            </FormMessage>  
          }
          
      </form>
    </Box>
  );
}

const onSubmit = (values, dispatch, {  showProgressBar, hideProgressBar, selectedStoreId }) => {
  showProgressBar();
  return axios.post('/api/stores/receipt', { id: selectedStoreId,  receiptSettings: values}).then( response => {
    hideProgressBar();
    if(response.data.store._id)
    {
      dispatch( updateStore(selectedStoreId, response.data.store) );
      dispatch( storesStampChanged(selectedStoreId, response.data.now) );
      dispatch( initialize('receiptSettings', values) );
      dispatch( showSuccess("Receipt settings updated") );
    }

  }).catch(err => {
    hideProgressBar();
    throw new SubmissionError({
      _error: err.response && err.response.data.message ? err.response.data.message: err.message
    });
  })
}

const validate = (values, props) => {
  const errors = {};
  return errors;
}



const mapStateToProps = (state) => {
  const store = state.stores.stores.find(item => item._id === state.stores.selectedStoreId);
  return {
    initialValues: store.receiptSettings,
    selectedStoreId: state.stores.selectedStoreId
  }
}
 
export default compose(
  connect(mapStateToProps, { showProgressBar, hideProgressBar }),
  reduxForm({
    form: 'receiptSettings',
    validate,
    onSubmit
  })
)(Receipt);