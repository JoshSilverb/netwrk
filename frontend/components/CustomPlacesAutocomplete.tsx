import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { FlatList, TouchableOpacity } from 'react-native';
import { View, Input, Text } from 'tamagui';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants/Styles';
import axios from 'axios';

interface PlacesPrediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

interface PlacesResponse {
  predictions: PlacesPrediction[];
  status: string;
}

interface CustomPlacesAutocompleteProps {
  placeholder?: string;
  onPress: (data: { description: string }, details?: any) => void;
  textInputProps?: any;
  styles?: {
    container?: any;
    textInput?: any;
    listView?: any;
  };
  predefinedPlaces?: any[];
  disableScroll?: boolean;
}

export interface CustomPlacesAutocompleteRef {
  setAddressText: (text: string) => void;
}

const CustomPlacesAutocomplete = forwardRef<CustomPlacesAutocompleteRef, CustomPlacesAutocompleteProps>(
  ({ placeholder = 'Search places...', onPress, textInputProps, styles, disableScroll }, ref) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<PlacesPrediction[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);

    useImperativeHandle(ref, () => ({
      setAddressText: (text: string) => {
        setQuery(text);
        setShowSuggestions(false);
      }
    }));

    const fetchSuggestions = async (input: string) => {
      if (input.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setLoading(true);
      try {
        const response = await axios.get<PlacesResponse>('https://mynetwrk.com/places/autocomplete', {
          params: { input }
        });

        if (response.data.status === 'OK') {
          setSuggestions(response.data.predictions || []);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error('Error fetching places:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setLoading(false);
      }
    };

    const handleInputChange = (text: string) => {
      setQuery(text);
      fetchSuggestions(text);
    };

    const handleSuggestionPress = (item: PlacesPrediction) => {
      setQuery(item.description);
      setShowSuggestions(false);
      onPress({ description: item.description }, null);
    };

    const renderSuggestion = ({ item }: { item: PlacesPrediction }) => (
      <TouchableOpacity
        onPress={() => handleSuggestionPress(item)}
        style={{
          padding: SPACING.sm,
          borderBottomWidth: 1,
          borderBottomColor: '#f0f0f0',
        }}
      >
        <View>
          <Text
            fontSize={TYPOGRAPHY.sizes.md}
            fontWeight={TYPOGRAPHY.weights.medium}
            numberOfLines={1}
          >
            {item.structured_formatting?.main_text || item.description}
          </Text>
          {item.structured_formatting?.secondary_text && (
            <Text
              fontSize={TYPOGRAPHY.sizes.sm}
              color="$gray10"
              numberOfLines={1}
              marginTop={2}
            >
              {item.structured_formatting.secondary_text}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );

    return (
      <View style={[{ flex: 0 }, styles?.container]}>
        <Input
          value={query}
          onChangeText={handleInputChange}
          placeholder={placeholder}
          style={[
            {
              fontSize: TYPOGRAPHY.sizes.md,
              paddingHorizontal: SPACING.md,
              paddingVertical: SPACING.sm,
              borderWidth: 0,
              backgroundColor: 'transparent',
            },
            textInputProps?.style,
            styles?.textInput
          ]}
          {...textInputProps}
        />

        {showSuggestions && suggestions.length > 0 && (
          <View
            style={[
              {
                backgroundColor: 'white',
                borderRadius: BORDER_RADIUS.md,
                marginTop: SPACING.xs,
                maxHeight: 200,
                borderWidth: 1,
                borderColor: '#e0e0e0',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 4,
              },
              styles?.listView
            ]}
          >
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.place_id}
              renderItem={renderSuggestion}
              scrollEnabled={!disableScroll}
              keyboardShouldPersistTaps="always"
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {loading && (
          <View style={{ padding: SPACING.sm }}>
            <Text fontSize={TYPOGRAPHY.sizes.sm} color="$gray10" textAlign="center">
              Searching...
            </Text>
          </View>
        )}
      </View>
    );
  }
);

CustomPlacesAutocomplete.displayName = 'CustomPlacesAutocomplete';

export default CustomPlacesAutocomplete;