import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_MAPS_API_KEY } from '../utils/constants';
import { IconButton } from 'react-native-paper';

export default function LocationSearchInput({
  placeholder,
  onLocationSelect,
  value,
  onClear,
  showClearButton = false
}) {
  const ref = React.useRef();

  React.useEffect(() => {
    if (value && ref.current) {
      ref.current.setAddressText(value);
    }
  }, [value]);

  return (
    <View style={styles.container}>
      <GooglePlacesAutocomplete
        ref={ref}
        placeholder={placeholder}
        onPress={(data, details = null) => {
          // data contains description and place_id
          // details contains geometry (lat/lng) and other info
          if (details) {
            const location = {
              lat: details.geometry.location.lat,
              lng: details.geometry.location.lng,
              address: data.description,
            };
            onLocationSelect(location);
          }
        }}
        query={{
          key: GOOGLE_MAPS_API_KEY,
          language: 'en',
        }}
        fetchDetails={true}
        enablePoweredByContainer={false}
        styles={{
          container: styles.autocompleteContainer,
          textInputContainer: styles.textInputContainer,
          textInput: styles.textInput,
          listView: styles.listView,
          row: styles.row,
          description: styles.description,
        }}
        textInputProps={{
          placeholderTextColor: '#999',
        }}
      />
      {showClearButton && value && (
        <IconButton
          icon="close-circle"
          size={20}
          onPress={() => {
            if (ref.current) {
              ref.current.clear();
            }
            onClear();
          }}
          style={styles.clearButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 15,
  },
  autocompleteContainer: {
    flex: 0,
    zIndex: 1,
  },
  textInputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  textInput: {
    height: 56,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  listView: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderTopWidth: 0,
    marginTop: -1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  row: {
    padding: 13,
    height: 50,
  },
  description: {
    fontSize: 14,
  },
  clearButton: {
    position: 'absolute',
    right: 0,
    top: 8,
    zIndex: 2,
  },
});
