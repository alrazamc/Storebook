import React from 'react';
import { DatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import Utils from '@date-io/moment';
import moment from 'moment';

const DateInput = ({
  label, dateFormat, disabled=false,
  meta: { touched, invalid, error },
  input: { value, ...rest },
  ...custom
}) => {
  return (
    <MuiPickersUtilsProvider utils={Utils}>
      <DatePicker
        label={label}
        error={ touched && invalid }
        helperText={ touched && error }
        format={dateFormat}
        value={ value ? moment(value, dateFormat).toDate() : null }
        disabled={disabled}
        {...rest}
        {...custom}
      />
    </MuiPickersUtilsProvider>
    
  );
}
 
export default DateInput;