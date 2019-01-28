import React, { useState, useLayoutEffect, useContext, useMemo, useRef } from 'react';
import { FormRegisterContext } from '../Context';
import useFormApi from './useFormApi';
import Debug from 'debug';
const logger = Debug('informed:useField'+ '\t');

function useField(field, fieldProps = {}) {
  // Pull props off of field props
  const { 
    validate,
    initialValue,
    validateOnChange,
    validateOnBlur,
    onValueChange,
    notify,
    keepState, 
    debug
  } = fieldProps;

  // Initialize state 
  // TODO support numbers
  const [value, setVal] = useState(initialValue != null ? initialValue : '');
  const [error, setErr] = useState();
  const [touched, setTouch] = useState();

  // Grab the form register context
  const updater = useContext(FormRegisterContext);

  // Grab the form state
  const formApi = useFormApi();

  /* ---------------------- Setters ---------------------- */

  // Define set error
  const setError = (val) => { 
    setErr(val);
    updater.setError(field, val);
  };

  // Define set value
  const setValue = val => {
    // We only need to call validate if the user gave us one
    // and they want us to validate on change
    if (validate && validateOnChange) {
      setError(validate(val, formApi.getValues()));
    }
    // Now we update the value
    setVal(val);
    // If the user passed in onValueChange then call it!
    if( onValueChange ){
      onValueChange(val);
    }
    // Call the updater
    updater.setValue(field, val);
  };

  // Define set touched
  const setTouched = val => {
    // We only need to call validate if the user gave us one
    // and they want us to validate on blur
    if (validate && validateOnBlur) {
      setError(validate(value));
    }
    setTouch(val);
    updater.setTouched(field, val);
  };

  // Define reset
  const reset = () => {
    // TODO support numbers
    setValue(initialValue != null ? initialValue : '');
    // Setting somthing to undefined will remove it 
    setError(undefined);
    setTouched(undefined);
  };

  // Define validate
  const fieldValidate = (val) => {
    if( validate ){
      setError(validate(val, formApi.getValues()));
    }
  };

  /* ----------------- Field Api && State ----------------- */

  // Build the field api
  const fieldApi = {
    setValue,
    setTouched,
    setError,
    reset, 
    validate: fieldValidate
  };

  // Build the field state
  const fieldState = {
    value,
    error,
    touched
  };

  logger('Render', field, fieldState);

  let ref;
  if(debug){
    ref = useRef(null);
  }

  // We want to register and deregister this field when field name changes
  useLayoutEffect(
    () => {
      logger('Register', field);
      updater.register(field, fieldState, { field, fieldApi, fieldState, notify, keepState });

      return () => {
        logger('Deregister', field);
        updater.deregister(field);
      };
    },
    // This is VERYYYY!! Important!
    [field]
  );

  // We want to let the controller know of changes on this field when specific props change
  useLayoutEffect(
    () => {
      logger('Update', field);
      updater.update(field, { field, fieldApi, fieldState, notify, keepState });
    },
    // This is VERYYYY!! Important!
    [validate, validateOnChange, validateOnBlur, onValueChange]
  );

  // for debugging
  useLayoutEffect(
    () => {
      if (debug && ref) {
        ref.current.style.border = '5px solid orange';
        setTimeout(() => {
          ref.current.style.borderWidth ='2px';
          ref.current.style.borderStyle = 'inset';
          ref.current.style.borderColor = 'initial';
          ref.current.style.borderImage = 'initial';
        }, 500);
      }
    }
  );

  // This is an awesome optimization!!
  const shouldUpdate = [ ...Object.values(fieldState), ...Object.values(fieldProps) ];

  const purify = (children, userprops = []) => useMemo(() => children, [ ...shouldUpdate, ...userprops]);

  return { fieldState, fieldApi, purify, ref };

}

export default useField;