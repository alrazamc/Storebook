import React, { useEffect, useRef, useMemo } from 'react';
import { Box, Button, makeStyles } from '@material-ui/core';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch, faSync, faUndo } from '@fortawesome/free-solid-svg-icons';
import { changeFilters } from '../../store/actions/saleActions';
import { Field, reduxForm, getFormValues, initialize } from 'redux-form';
import { useSelector } from 'react-redux';
import { compose } from 'redux';
import { connect } from 'react-redux';
import DateRangeInput from '../library/form/DateRangeInput';
import SelectInput from 'components/library/form/SelectInput';
import TextInput from 'components/library/form/TextInput';
import { allowOnlyPostiveNumber } from 'utils';

const formName = 'salesFilters';

const useStyles = makeStyles(theme => ({
  searchBtn: {
    paddingLeft: 0,
    paddingRight: 0,
    minWidth: 45,
    minHeight: 40,
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  startIcon: {
    marginRight: 0
  },
  heading: {
    fontSize: theme.typography.pxToRem(15),
    fontWeight: theme.typography.fontWeightBold
  }
}));

const defaultFilters = {
  userId: 0,
  saleNumber: "",
  dateRange: "",
}

const areFiltersApplied = (filters) => {
  let filtersApplied = false;
  for(let key in filters)
  {
    if(!filters.hasOwnProperty(key)) continue;
    if(filters[key] !== defaultFilters[key])
    {
      filtersApplied = true;
    }
    if(filtersApplied) break;
  }
  return filtersApplied;
}

function SaleFilters(props){
  const { dispatch, pristine, dirty, users } = props;
  const { storeId, storeFilters } = props;
  
  const classes = useStyles();
  const filters = useSelector(state => getFormValues(formName)(state));
  const pageLoad = useRef();

  const userOptions = useMemo(() => {
    let options = users.map(user => ({ id: user._id, title: user.name }) );
    return [{ id: 0, title: "Select user" }, ...options]
  }, [users]);

  //Run only at page load, if filtersWereApplied before, clearfilters and reload items
  useEffect(() => {
    if(pageLoad.current) return;
    pageLoad.current = storeFilters;
    let filtersApplied = areFiltersApplied(storeFilters);
      if(filtersApplied)
        dispatch( changeFilters(storeId, defaultFilters) );
  }, [dispatch, storeId, storeFilters]);

  //for reset button
  let filtersApplied = areFiltersApplied(storeFilters);

  const resetFilters = () => {
    dispatch( initialize(formName, defaultFilters) );
    dispatch( changeFilters(storeId, {...defaultFilters}) );
  }

  const searchRecords = () => {
    dispatch( initialize(formName, filters) );
    dispatch( changeFilters(storeId, filters) );
  }

  return(
    <>
    <Box width="100%" justifyContent="flex-end" alignItems="flex-start" display="flex">
      <Box flexGrow={1} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
        <Box width={{ xs: '100%', md: '31%' }} >
          <Field
            component={DateRangeInput}
            label="Date Range"
            name="dateRange"
            placeholder="Select Date Range..."
            fullWidth={true}
            variant="outlined"
            margin="dense"
          />
        </Box>
        <Box width={{ xs: '100%', md: '20%' }} >
          <Field
            component={SelectInput}
            options={userOptions}
            name="userId"
            fullWidth={true}
            variant="outlined"
            margin="dense"
          />
        </Box>
        <Box width={{ xs: '100%', md: '20%' }} >
          <Field
            component={TextInput}
            name="saleNumber"
            fullWidth={true}
            variant="outlined"
            margin="dense"
            label="Receipt #"
            placeholder="Receipt number..."
            onKeyDown={allowOnlyPostiveNumber}
          />
        </Box>
        <Box width={{ xs: '100%', md: '21%' }} alignSelf="flex-start" display="flex" pt={1}>
            <Button title="Search" disabled={pristine || !dirty} onClick={searchRecords} startIcon={ <FontAwesomeIcon icon={faSearch} /> } classes={{ root: classes.searchBtn, startIcon: classes.startIcon }} variant="outlined" color="primary" disableElevation ></Button>
            <Button title={ filtersApplied ? "Reset Filters" : "Refresh" }  onClick={resetFilters} startIcon={ <FontAwesomeIcon icon={filtersApplied ? faUndo : faSync}  /> } classes={{ root: classes.searchBtn, startIcon: classes.startIcon }} variant="outlined" color="primary" disableElevation ></Button>
        </Box>
      </Box>
      <Box pt={1} minWidth="160px" display="flex" justifyContent="center">
        <Button startIcon={ <FontAwesomeIcon icon={faPlus} /> } variant="contained" color="primary" disableElevation component={Link} to="/sale" >New Sale </Button>
      </Box>
    </Box>
    </>
  )
}

const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;
  const store = state.stores.stores.find(store => store._id === storeId);
  const sales = state.sales[storeId] ? state.sales[storeId] : {
    records: [],
    totalRecords: 0,
    recordsLoaded: false,
    filters: {}
  }
  return {
    storeId,
    users: store.users.map(user => user.record),
    storeFilters: sales.filters
  }
}

export default compose(
  connect(mapStateToProps),
  reduxForm({
    form: formName,
    initialValues: defaultFilters
  })
)
(SaleFilters);