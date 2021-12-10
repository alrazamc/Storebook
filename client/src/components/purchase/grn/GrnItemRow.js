import React, { useMemo, useState } from 'react'
import { TableRow, TableCell, Box, IconButton, Collapse, Button, Popover } from '@material-ui/core';
import { allowOnlyPostiveNumber } from '../../../utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxOpen, faChevronDown, faChevronUp, faExclamationTriangle, faTimes } from '@fortawesome/free-solid-svg-icons';
import TextInput from '../../library/form/TextInput';
import { Field } from 'redux-form';
import DateInput from '../../library/form/DateInput';

function GrnItemRow(props){
  const { item, values, supplierId, beforeLastEndOfDay=false, removeItem } = props;
  const [open, setOpen] = useState(false);
  const itemAmount = useMemo(() => {
    let total = 0;
    let costPrice = isNaN(values[item._id].costPrice) ? 0 :  Number(values[item._id].costPrice);
    let quantity = isNaN(values[item._id].quantity) ? 0 :  Number(values[item._id].quantity);
    let adjustment = isNaN(values[item._id].adjustment) ? 0 :  quantity * Number(values[item._id].adjustment);
    let tax = isNaN(values[item._id].tax) ? 0 :  quantity * Number(values[item._id].tax);
    total = costPrice * quantity;
    total += tax;
    total -= adjustment;
    return (+total.toFixed(2)).toLocaleString();
  }, [values, item]);

  const [anchorEl, setAnchorEl] = useState(null);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  const packDetailsopen = Boolean(anchorEl);
  return(
    <>
      <TableRow hover key={item._id}>
        <TableCell>
          <IconButton onClick={() => setOpen(!open)}>
            <FontAwesomeIcon icon={ !open ? faChevronDown : faChevronUp } size="sm" />
          </IconButton>
        </TableCell>
        <TableCell>
          <Box my={1} display="flex" justifyContent="space-between">
            <span>
              {item.itemName}
            </span>
            { item.packParentId ? <span style={{ color: '#7c7c7c' }}>Packing <FontAwesomeIcon title="Packing" style={{ marginLeft: 4 }} icon={faBoxOpen} /> </span> : null }
            {
              item.sizeName ?
              <span style={{ color: '#7c7c7c' }}> {item.sizeName} | {item.combinationName} </span>
              : null
            }
          </Box>
          <Box mb={1} display="flex" justifyContent="space-between" style={{ color: '#7c7c7c' }}>
            <span>{item.itemCode}{item.sizeCode ? '-'+item.sizeCode+'-'+item.combinationCode : '' }</span>
            <span>Price: { item.packParentId ? item.packSalePrice.toLocaleString() : item.salePrice.toLocaleString() } </span>
          </Box>
        </TableCell>
        <TableCell align="center">
          {item.currentStock.toLocaleString()}
          { item.lowStock ? <FontAwesomeIcon title="Low Stock" color="#c70000" style={{ marginLeft: 4 }} icon={faExclamationTriangle} /> : null }
          { item.overStock ? <FontAwesomeIcon title="Over Stock" color="#06ba3a" style={{ marginLeft: 4 }} icon={faExclamationTriangle} /> : null }
          { item.packParentId ? <Box style={{ color: '#7c7c7c' }}>units</Box> : null }
        </TableCell>
        <TableCell align="center">
          <Box height="100%" display="flex" justifyContent="center" alignItems="center">
            <Field
              component={TextInput}
              label="Cost Price"
              name={`items[${item._id}].costPrice`}
              placeholder="Cost Price..."
              fullWidth={true}
              variant="outlined"
              margin="dense"
              type="number"
              disabled={!supplierId || beforeLastEndOfDay}
              inputProps={{  min: 0 }}
              showError={false}
              onKeyDown={allowOnlyPostiveNumber}
            />
          </Box>
        </TableCell>
        <TableCell align="center">
          <Field
            component={TextInput}
            label="Quantity"
            name={`items[${item._id}].quantity`}
            placeholder="Quantity..."
            fullWidth={true}
            variant="outlined"
            margin="dense"
            disabled={!supplierId || beforeLastEndOfDay}
            type="number"
            inputProps={{  min: 1 }}
            showError={false}
            onKeyDown={allowOnlyPostiveNumber}
          />
        </TableCell>
        <TableCell align="center">
          { itemAmount }
        </TableCell>
        <TableCell align="center">
          <IconButton disabled={!supplierId || beforeLastEndOfDay} onClick={() => removeItem(item)}>
            <FontAwesomeIcon icon={faTimes} size="xs" />
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan="7" style={ { height: open ? 'inherit' : '0px',  } }>
          <Collapse in={open}>
            <Box py={2} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
              <Box width={{ xs: '100%', md: '24%' }}>
                <Field
                  component={TextInput}
                  label="Adjustment"
                  name={`items[${item._id}].adjustment`}
                  placeholder="Adjustment..."
                  fullWidth={true}
                  variant="outlined"
                  margin="dense"
                  type="number"
                  disabled={!supplierId || beforeLastEndOfDay}
                  inputProps={{  min: 0 }}
                  showError={false}
                  onKeyDown={allowOnlyPostiveNumber}
                />
              </Box>
              <Box width={{ xs: '100%', md: '24%' }}>
                <Field
                  component={TextInput}
                  label="Tax"
                  name={`items[${item._id}].tax`}
                  placeholder="Tax..."
                  fullWidth={true}
                  variant="outlined"
                  margin="dense"
                  type="number"
                  disabled={!supplierId || beforeLastEndOfDay}
                  inputProps={{  min: 0 }}
                  showError={false}
                  onKeyDown={allowOnlyPostiveNumber}
                />
              </Box>
              <Box width={{ xs: '100%', md: '24%' }}>
                <Field
                  component={TextInput}
                  label="Sale Price(unit)"
                  name={`items[${item._id}].salePrice`}
                  placeholder="Sale Price..."
                  fullWidth={true}
                  variant="outlined"
                  margin="dense"
                  type="number"
                  disabled={!supplierId || beforeLastEndOfDay}
                  inputProps={{  min: 0 }}
                  showError={false}
                  onKeyDown={allowOnlyPostiveNumber}
                />
              </Box>
              <Box width={{ xs: '100%', md: '24%' }}>
                {
                  !item.packParentId ? null : 
                  <Field
                    component={TextInput}
                    label="Packe Sale Price"
                    name={`items[${item._id}].packSalePrice`}
                    placeholder="Pack Sale Price..."
                    fullWidth={true}
                    variant="outlined"
                    margin="dense"
                    type="number"
                    disabled={!supplierId || beforeLastEndOfDay}
                    inputProps={{  min: 0 }}
                    showError={false}
                    onKeyDown={allowOnlyPostiveNumber}
                  />
                }
              </Box>
              <Box width={{ xs: '100%', md: '24%' }}>
                <Field
                  component={TextInput}
                  label="Batch No."
                  name={`items[${item._id}].batchNumber`}
                  placeholder="Batch No..."
                  fullWidth={true}
                  variant="outlined"
                  margin="dense"
                  type="text"
                  showError={false}
                  disabled={!supplierId || beforeLastEndOfDay}
                />
              </Box>
              <Box width={{ xs: '100%', md: '24%' }}>
                <Field
                  component={DateInput}
                  dateFormat="DD MMMM, YYYY"
                  label="Expiry Date."
                  name={`items[${item._id}].batchExpiryDate`}
                  placeholder="Expiry Date..."
                  fullWidth={true}
                  inputVariant="outlined"
                  margin="dense"
                  type="text"
                  disabled={!supplierId || beforeLastEndOfDay}
                />
              </Box>
              <Box width={{ xs: '100%', md: '24%' }}>
                <Field
                  component={TextInput}
                  label="Notes"
                  name={`items[${item._id}].notes`}
                  placeholder="Notes..."
                  fullWidth={true}
                  variant="outlined"
                  margin="dense"
                  type="text"
                  showError={false}
                  disabled={!supplierId || beforeLastEndOfDay}
                />
              </Box>
              <Box width={{ xs: '100%', md: '24%' }} pt={1} textAlign="center">
                {
                  !item.packParentId ? null : 
                  <>
                    <Button color="primary" onClick={handleClick}>Pack Details</Button>
                    <Popover 
                      open={packDetailsopen}
                      anchorEl={anchorEl}
                      onClose={handleClose}
                      anchorOrigin={{
                        vertical: 'center',
                        horizontal: 'left',
                      }}
                      transformOrigin={{
                        vertical: 'center',
                        horizontal: 'right',
                      }}
                      >
                      <Box py={2} px={2} >
                        <Box display="flex" justifyContent="space-between" width="230px" flexWrap="wrap">
                          <Box width="55%" mb={1}>Units in Pack</Box>
                          <Box width="30%" mb={1} textAlign="left">{ item.packQuantity }</Box>

                          <Box width="55%" mb={1}>Total Units</Box>
                          <Box width="30%" mb={1} textAlign="left">{ item.packQuantity * ( isNaN(values[item._id].quantity) ? 0 :  values[item._id].quantity )  }</Box>

                          <Box width="55%" mb={1}>Units Cost Price</Box>
                          <Box width="30%" mb={1} textAlign="left">{ (+(( isNaN(values[item._id].costPrice) ? 0 :  values[item._id].costPrice ) / item.packQuantity).toFixed(2)).toLocaleString() }</Box>

                          <Box width="55%" mb={1}>Units Sale Price</Box>
                          <Box width="30%" mb={1} textAlign="left">{ Number(values[item._id].salePrice).toLocaleString() }</Box>
                        </Box>
                      </Box>
                    </Popover>
                  </>
                }
              </Box>
            </Box>
          </Collapse>

        </TableCell>
      </TableRow>
    </>
  )
}

export default GrnItemRow;