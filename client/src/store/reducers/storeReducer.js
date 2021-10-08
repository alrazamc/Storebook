import { actionTypes } from '../actions/storeActions';
import { actionTypes as authActions } from '../actions/authActions';
const initState = {
  stores: [],
  allLoaded: false,
  selectedStoreId: null,
  userRole: null,
}

const storeReducer = (state = initState, action) => {
  switch(action.type)
  {
    case authActions.LOGOUT_SUCCESS:
    case authActions.AUTH_FAILED:
      return initState;
    case actionTypes.STORES_LOADED:
      return{
        ...state,
        stores: action.stores,
        allLoaded: true
      }
    case actionTypes.STORE_CREATED:
      return{
        ...state,
        stores: [...state.stores, action.store]
      }
    case actionTypes.STORE_UPDATED:
      return{
        ...state,
        stores: state.stores.map(item => (item._id === action.id ? action.store : item))
      }
    case actionTypes.STORE_SELECTED:
      return{
        ...state,
        selectedStoreId: action.id,
        userRole: action.userRole
      }
    case actionTypes.STORE_DELETED: 
      return{
        ...state,
        selectedStoreId:  action.id === state.selectedStoreId ? null : state.selectedStoreId,
        stores: state.stores.filter((item) => item._id !== action.id)
      }
    default:
      return state;
  }
}

export default storeReducer;