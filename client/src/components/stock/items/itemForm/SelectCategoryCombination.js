import React, { useState, useEffect, useRef } from 'react';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, CircularProgress, makeStyles, Dialog, DialogTitle, DialogContent, DialogActions } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import { change, Field, initialize, reduxForm, SubmissionError } from 'redux-form';
import TextInput from '../../../library/form/TextInput';
import FormMessage from '../../../library/FormMessage';
import axios from 'axios';
import { showSuccess } from '../../../../store/actions/alertActions';
import { updateCategory } from '../../../../store/actions/categoryActions';
import MultiAutoComplete from '../../../library/form/MultiAutoComplete';

function SelectCategoryCombination(props) {
  const { formName, categoryId, disabled=false, addNewRecord=true } = props;
  const { storeId, category } = useSelector(state => {
    let storeId = state.stores.selectedStoreId;
    const categories = state.categories[storeId] ? state.categories[storeId] : [];
    return {
      storeId,
      category: categories.find(item => item._id === categoryId)
    }
  })

  const dispatch = useDispatch();
  const lastCategory = useRef();
  
  useEffect(() => {
    if(lastCategory.current && lastCategory.current !== categoryId)
      dispatch( change(formName, 'combinations', [] ) );
    lastCategory.current = categoryId;
  }, [categoryId, dispatch, formName]);

  return(
    <>
    <Box display="flex">
      <Field
        component={MultiAutoComplete}
        options={category.combinations}
        getOptionLabel={(option) => option && option.title ? option.title : ""}
        label="Select Colors"
        id="select-colors"
        name="combinations"
        placeholder="Select available colors for this item"
        fullWidth={true}
        style={{ flexGrow: 1 }}
        disabled={disabled}
        addNewRecord={addNewRecord}
      />
      { addNewRecord && <AddCategoryCombinationForm disabled={disabled} storeId={storeId} categoryId={categoryId} formName={formName} /> }
    </Box>
    
    </>
  )
}

export default SelectCategoryCombination;

const useStyles = makeStyles(theme => ({
  startIcon: {
    marginRight: 0
  },
  actionButton:{
    marginTop: 8,
    marginBottom: 4, 
    paddingLeft: 0, 
    paddingRight: 0, 
    minWidth: 40,
    width: 40,
    height: 40,
    borderLeft: 0,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0
  }
}))

function AddCategoryCombination(props){
  const { handleSubmit, disabled, pristine, dispatch, submitSucceeded, submitting, error, invalid } = props;
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const handleClose = () => setOpen(false);

  const submitForm = (event) => {
    event.stopPropagation();
    handleSubmit(event);
  }

  useEffect(() => {
    if(submitSucceeded)
    {
      dispatch( initialize('addCategoryCombination', {}) );
      setOpen(false);
    }
  }, [submitSucceeded, dispatch])

  return(
    <>
    <Button 
      type="button"
      disabled={disabled}
      title="Add new property value"
      onClick={() => setOpen(true)}
      classes={{ root: classes.actionButton, startIcon: classes.startIcon }}
      disableElevation  startIcon={ <FontAwesomeIcon icon={faPlus} size="xs" /> } size="small" edge="end" variant="outlined">
    </Button>
    <Dialog open={open} fullWidth onClose={handleClose} aria-labelledby="form-dialog-title">
      <DialogTitle style={{ textAlign: 'center' }}>Add New Color</DialogTitle>
      <form onSubmit={submitForm}>
        <DialogContent>
          

          <Box display="flex" justifyContent="space-between">
            <Box width="46%">
              <Field
                component={TextInput}
                name="code"
                label="Code"
                variant="outlined"
                fullWidth={true}
                autoFocus={true}
                placeholder="e.g. 009 or BLK/RD/BLU"
                inputProps={{  maxlength: 3 }}
              />
            </Box>
            <Box width="46%">
              <Field
                component={TextInput}
                name="title"
                label="color"
                variant="outlined"
                fullWidth={true}
              />
            </Box>
          </Box>

          <Box px={2} display="flex" justifyContent="center" alignItems="center">
            <Button disableElevation type="submit"  color="primary" variant="contained" disabled={pristine || submitting || invalid}>
              Add Color { submitting && <CircularProgress style={{ marginLeft: 8 }} size={24} /> }
            </Button>
          </Box>
          <Box px={2} display="flex" justifyContent="center" alignItems="center">
            <FormMessage error={true} style={{visibility: !submitting && error ? 'visible' : 'hidden' }}>
              { error ? error : 'invalid request' }
            </FormMessage>  
          </Box>
          
        </DialogContent>
      </form>
      <DialogActions style={{ justifyContent: 'center' }}>
        <Button disableElevation type="button" onClick={handleClose} color="primary">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
    </>
  )
}


const onSubmit = (values, dispatch, { storeId, categoryId }) => {
  return axios.post('/api/categories/addCombination', { storeId, categoryId, ...values }).then( response => {
    if(response.data.category._id)
    {
      dispatch( updateCategory(storeId, categoryId, response.data.category, response.data.now, response.data.lastAction) );
      dispatch( showSuccess("New color added") );
    }

  }).catch(err => {
    throw new SubmissionError({
      _error: err.response && err.response.data.message ? err.response.data.message: err.message
    });
  })
}

const validate = (values, props) => {
  const errors = {};
  if(!values.code)
    errors.code = "Code is required";
  if(!values.title)
    errors.title = "Color name is required";
  return errors;
}


const AddCategoryCombinationForm = reduxForm({
  'form': 'addCategoryCombination',
  validate,
  onSubmit,
  initialValues: {}
})(AddCategoryCombination);
