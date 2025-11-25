import React, { useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import { FlatList, TouchableOpacity } from 'react-native';
import { View, Input, Text } from 'tamagui';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants/Styles';
import axios from 'axios';
import { getTagsForUserURL } from '@/constants/Apis';

interface CustomTagsAutocompleteProps {
  placeholder?: string;
  onPress: (tag: string) => void;
  textInputProps?: any;
  styles?: {
    container?: any;
    textInput?: any;
    listView?: any;
  };
  disableScroll?: boolean;
  token: string;
  value: string;
  onChangeText: (text: string) => void;
}

export interface CustomTagsAutocompleteRef {
  setTagText: (text: string) => void;
}

const CustomTagsAutocomplete = forwardRef<CustomTagsAutocompleteRef, CustomTagsAutocompleteProps>(
  ({ placeholder = 'Add a tag', onPress, textInputProps, styles, disableScroll, token, value, onChangeText }, ref) => {
    const [allTags, setAllTags] = useState<string[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);

    useImperativeHandle(ref, () => ({
      setTagText: (text: string) => {
        onChangeText(text);
        setShowSuggestions(false);
      }
    }));

    // Fetch all tags when component mounts
    useEffect(() => {
      fetchAllTags();
    }, [token]);

    const fetchAllTags = async () => {
      const requestBody = {
        user_token: token
      };

      try {
        const response = await axios.post(getTagsForUserURL, requestBody);
        setAllTags(response.data || []);
      } catch (error) {
        console.error('Error fetching tags:', error);
        setAllTags([]);
      }
    };

    const filterSuggestions = (input: string) => {
      if (input.length === 0) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const filtered = allTags.filter(tag =>
        tag.toLowerCase().startsWith(input.toLowerCase())
      );

      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    };

    const handleInputChange = (text: string) => {
      onChangeText(text);
      filterSuggestions(text);
    };

    const handleSuggestionPress = (tag: string) => {
      onChangeText(tag);
      setShowSuggestions(false);
      onPress(tag);
    };

    const renderSuggestion = ({ item }: { item: string }) => (
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
            {item}
          </Text>
        </View>
      </TouchableOpacity>
    );

    return (
      <View style={[{ flex: 0 }, styles?.container]}>
        <Input
          value={value}
          onChangeText={handleInputChange}
          placeholder={placeholder}
          style={[
            {
              fontSize: TYPOGRAPHY.sizes.sm,
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
                position: 'absolute',
                top: 40,
                left: 0,
                right: 0,
                zIndex: 1000,
              },
              styles?.listView
            ]}
          >
            <FlatList
              data={suggestions}
              keyExtractor={(item, index) => `${item}-${index}`}
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
              Loading tags...
            </Text>
          </View>
        )}
      </View>
    );
  }
);

CustomTagsAutocomplete.displayName = 'CustomTagsAutocomplete';

export default CustomTagsAutocomplete;
