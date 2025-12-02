import React, { useState, useEffect } from 'react';
import { Modal, Platform, Pressable } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { View, Text, Button, YStack, XStack } from 'tamagui';
import { Months } from '@/constants/Definitions';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants/Styles';

interface DatePickerModalProps {
    value: Date | null;
    onChange: (date: Date) => void;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    textColor?: string;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
    value,
    onChange,
    label,
    placeholder,
    disabled = false,
    textColor = "$color"
}) => {
    const defaultDate = (date: Date | null) => {
        return date ? date : new Date(Date.now())
    }
    
    const [showPicker, setShowPicker] = useState(false);
    const [tempDate, setTempDate] = useState(defaultDate(value));

    // Update tempDate when value prop changes
    useEffect(() => {
        setTempDate(defaultDate(value));
    }, [value]);


    const handlePress = () => {
        if (!disabled) {
            setTempDate(defaultDate(value));
            setShowPicker(true);
        }
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowPicker(false);
            if (event.type === 'set' && selectedDate) {
                onChange(selectedDate);
            }
        } else {
            // iOS: update temp date as user scrolls
            if (selectedDate) {
                setTempDate(selectedDate);
            }
        }
    };

    const handleConfirm = () => {
        onChange(tempDate);
        setShowPicker(false);
    };

    const handleCancel = () => {
        setTempDate(defaultDate(value)); // Reset to original value
        setShowPicker(false);
    };

    const formatDate = (date: Date) => {
        return `${date.getDate()} ${Months[date.getMonth()]} ${date.getFullYear()}`;
    };

    return (
        <>
            <Pressable onPress={handlePress} disabled={disabled}>
                <View
                    padding={SPACING.sm}
                    borderWidth={1}
                    borderColor="$borderColor"
                    borderRadius={BORDER_RADIUS.sm}
                    backgroundColor="$background"
                    minHeight={44}
                    justifyContent="center"
                    opacity={disabled ? 0.5 : 1}
                >
                    <Text
                        fontSize={TYPOGRAPHY.sizes.sm}
                        textAlign="center"
                        color={textColor}
                    >
                        {placeholder && !value ? placeholder : formatDate(value)}
                    </Text>
                </View>
            </Pressable>

            {/* iOS Modal */}
            {Platform.OS === 'ios' && showPicker && (
                <Modal
                    visible={showPicker}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={handleCancel}
                >
                    <Pressable
                        style={{
                            flex: 1,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                        onPress={handleCancel}
                    >
                        <Pressable
                            onPress={(e) => e.stopPropagation()}
                            style={{ width: '90%', maxWidth: 400 }}
                        >
                            <View
                                backgroundColor="$background"
                                borderRadius={BORDER_RADIUS.lg}
                                padding={SPACING.lg}
                            >
                                {label && (
                                    <Text
                                        fontSize={TYPOGRAPHY.sizes.lg}
                                        fontWeight={TYPOGRAPHY.weights.semibold}
                                        marginBottom={SPACING.md}
                                        textAlign="center"
                                    >
                                        {label}
                                    </Text>
                                )}

                                <DateTimePicker
                                    testID="dateTimePicker"
                                    value={tempDate}
                                    mode="date"
                                    display="inline"
                                    onChange={handleDateChange}
                                />

                                <XStack space={SPACING.sm} marginTop={SPACING.md}>
                                    <Button
                                        flex={1}
                                        size="$4"
                                        variant="outlined"
                                        onPress={handleCancel}
                                        fontSize={TYPOGRAPHY.sizes.md}
                                        borderRadius={BORDER_RADIUS.md}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        flex={1}
                                        size="$4"
                                        onPress={handleConfirm}
                                        backgroundColor="$blue9"
                                        color="white"
                                        fontSize={TYPOGRAPHY.sizes.md}
                                        borderRadius={BORDER_RADIUS.md}
                                    >
                                        Done
                                    </Button>
                                </XStack>
                            </View>
                        </Pressable>
                    </Pressable>
                </Modal>
            )}

            {/* Android Picker */}
            {Platform.OS === 'android' && showPicker && (
                <DateTimePicker
                    testID="dateTimePicker"
                    value={tempDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                />
            )}
        </>
    );
};
