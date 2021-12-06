import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, makeStyles, TextField, Typography } from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { useSelector } from 'react-redux';
import barcodeReader from '@wrurik/barcode-scanner';
import ItemPickerPopup from './ItemPickerPopup';


const useStyles = makeStyles(theme => ({
  inputNoBorder:{
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  option: {
    '&:not(:last-child)':{
      borderBottom: "1px solid #ececec"
    }
  },
  paper: {
    border: "2px solid #d7d7d7"
  }
}));

function ItemPicker(props) {
  const classes = useStyles();
  const { supplierId, selectedItems, selectItem, removeItem, disabled=false, showServiceItems=false } = props;
  const storeId = useSelector(state => state.stores.selectedStoreId);
  let items = useSelector(state => state.items[storeId].allItems );
  items = useMemo(() => showServiceItems ? items : items.filter(item => item.isServiceItem === false), [items, showServiceItems]);
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const inputRef = useRef();

  const selectSuggestion = useCallback((item) => {
    if(item)
      selectItem(item);
    setInputValue("");
  }, [selectItem]);

  useEffect(() => {
    if(disabled || popupOpen) return;
    let removeListener = barcodeReader.onScan((itemCode) => {
      let records = items.filter(item => {
        if(item.sizeId)
          return `${item.itemCode}-${item.sizeCode}-${item.combinationCode}` === itemCode
        else
          return item.itemCode === itemCode
      });
      if(records.length === 1)
      {
        selectItem(records[0]);
        setInputValue("");
        setShowSuggestions(false);
      }
      else if(records.length === 0 || records.length > 1)
      {
        setInputValue(itemCode);
        inputRef.current.focus();
        setShowSuggestions(true);
      }
    }, {});

    return () => removeListener()
  }, [disabled, items, selectItem, popupOpen]);

  return(
    <Box display="flex" position="relative" id="item-picker-container">
      <Autocomplete
      renderInput={(params) => <TextField  {...params} label="Search Items" InputLabelProps={{ shrink: true }} margin="dense" inputRef={inputRef}  placeholder="type item name or scan code" variant="outlined" style={{ borderRadius: 0 }} onKeyPress={event => {if(event.key === "Enter") event.preventDefault()}} />}
      classes={{ inputRoot: classes.inputNoBorder, option: classes.option, paper: classes.paper }}
      value={null}
      fullWidth={true}
      options={items}
      getOptionLabel={(option) => option && option.itemName ? option.itemName : ""}
      renderOption={SuggestedItem}
      disabled={disabled}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => {
        console.log('newinputvalue', event.type);
        if(event && event.type === 'blur')
        {
        }else
        {
          setInputValue(newInputValue);
          if(newInputValue !== "" && !showSuggestions)
            setShowSuggestions(true);
          else if(newInputValue === "" && showSuggestions)
            setShowSuggestions(false);
        }
      }}
      open={showSuggestions}
      onOpen={event => {
        if(event.type === "mousedown" && inputValue !== "")
          setShowSuggestions( true )
      } }
      onClose={event => setShowSuggestions( false ) }
      forcePopupIcon={false}
      clearOnBlur={false}
      noOptionsText="No items found by this name or code"
      onChange={(event, selectedOption) => selectSuggestion( selectedOption ? selectedOption: null ) }
      getOptionSelected={(option, value) => option._id === value}
      filterOptions={(options, state) => {
        let query = state.inputValue.toLowerCase();
        if(query === "") return [];
        return options.filter(item => {
          if(item.itemName.toLowerCase().indexOf(query) !== -1) return true;
          if(item.sizeId)
            return (`${item.itemCode}-${item.sizeCode}-${item.combinationCode}`).toLowerCase().indexOf(query) !== -1;
          else
            return item.itemCode.toLowerCase().indexOf(query) !== -1;
        })
      }}
      />
      
      <ItemPickerPopup {...{ disabled, supplierId, selectItem, removeItem, selectedItems, showServiceItems, popupOpen, setPopupOpen }} />
    </Box>
  )
}

function SuggestedItem(item, state){
  return(
  <Box width="100%">
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Typography>{item.itemName}</Typography>
      <Typography style={{ color: '#6c6a6a', fontSize: 14 }}>{item.sizeName} { item.sizeName && item.combinationName ? "|" : ""  } {item.combinationName}</Typography>
    </Box>
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Typography style={{ color: '#6c6a6a', fontSize: 14 }}>{item.itemCode}{item.sizeCode ? '-' : ""}{item.sizeCode}{item.combinationCode ? '-' : ""}{item.combinationCode}</Typography>
      <Typography style={{ color: '#6c6a6a', fontSize: 14 }}>Price: { item.packParentId ? item.packSalePrice.toLocaleString() : item.salePrice.toLocaleString('en-US') }</Typography>
    </Box>
  </Box>
  )
}


export default ItemPicker;