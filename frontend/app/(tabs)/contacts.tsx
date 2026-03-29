import { useState, useCallback, useEffect } from 'react';
import ContactsList from '@/components/ContactsList'
import { ScrollView, YStack, Input, Button, XStack, Sheet, Text, View } from 'tamagui';
import { Loader } from '@/components/Loader';
import { searchContactsURL, getTagsForUserURL } from '@/constants/Apis';
import { useAuth } from '@/components/AuthContext';
import { Keyboard, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ChevronDown } from '@tamagui/lucide-icons';
import { getCurrentLocation } from '@/utils/locationutil';
import { SPACING, TYPOGRAPHY, CONTAINER_STYLES, BORDER_RADIUS } from '@/constants/Styles';
import { useFocusEffect } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDateForAPI } from '@/utils/utilfunctions'
import { DatePickerModal } from '@/components/DatePickerModal';

import axios from 'axios';

const FILTER_STATE_KEY = '@contacts_filter_state';

export default function ContactsScreen() {
    const sortOptions = [
        'Date added',
        'Last contacted (newest)',
        'Last contacted (oldest)',
        'Alphabetical',
        'Distance',
        'Relevance',
        'Next contact date',
    ];

    const { token } = useAuth();

    const [searchError, setSearchError] = useState<string>('');
    const [tags, setTags] = useState<string[]>([]);
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedSortOption, setSelectedSortOption] = useState(sortOptions[0]);
    const [dateLowerBound, setDateLowerBound] = useState(new Date(0));
    const [dateUpperBound, setDateUpperBound] = useState(new Date(Date.now()));
    const [filterStateLoaded, setFilterStateLoaded] = useState(false);

    const [filterSheetOpen, setFilterSheetOpen] = useState(false);
    const [sortExpanded, setSortExpanded] = useState(false);
    const [tagSearch, setTagSearch] = useState('');

    useFocusEffect(
        useCallback(() => {
            const loadAndFetch = async () => {
                try {
                    const savedState = await AsyncStorage.getItem(FILTER_STATE_KEY);

                    let filterState = {
                        searchQuery: '',
                        selectedTags: [] as string[],
                        selectedSortOption: sortOptions[0],
                        dateLowerBound: new Date(0),
                        dateUpperBound: new Date(Date.now()),
                    };

                    if (savedState) {
                        const parsed = JSON.parse(savedState);
                        filterState = {
                            searchQuery: parsed.searchQuery || '',
                            selectedTags: parsed.selectedTags || [],
                            selectedSortOption: parsed.selectedSortOption || sortOptions[0],
                            dateLowerBound: parsed.dateLowerBound ? new Date(parsed.dateLowerBound) : new Date(0),
                            dateUpperBound: parsed.dateUpperBound ? new Date(parsed.dateUpperBound) : new Date(Date.now()),
                        };
                    }

                    setSearchQuery(filterState.searchQuery);
                    setSelectedTags(filterState.selectedTags);
                    setSelectedSortOption(filterState.selectedSortOption);
                    setDateLowerBound(filterState.dateLowerBound);
                    setDateUpperBound(filterState.dateUpperBound);
                    setFilterStateLoaded(true);

                    await fetchTagsWithState();
                    await fetchContactsWithState(filterState);
                } catch (error) {
                    if (__DEV__) console.error('Error in loadAndFetch:', error);
                }
            };
            loadAndFetch();
        }, [token])
    );

    useEffect(() => {
        if (!filterStateLoaded) return;

        const saveFilterState = async () => {
            try {
                const stateToSave = {
                    searchQuery,
                    selectedTags,
                    selectedSortOption,
                    dateLowerBound: dateLowerBound.toISOString(),
                    dateUpperBound: dateUpperBound.toISOString(),
                };
                await AsyncStorage.setItem(FILTER_STATE_KEY, JSON.stringify(stateToSave));
            } catch (error) {
                if (__DEV__) console.error('Error saving filter state:', error);
            }
        };
        saveFilterState();
    }, [searchQuery, selectedTags, selectedSortOption, dateLowerBound, dateUpperBound, filterStateLoaded]);

    function isDateUnset(date: Date): boolean {
        return String(date) === String(new Date(0));
    }

    function isDateToday(date: Date): boolean {
        return String(date) === String(new Date(Date.now()));
    }

    const fetchTagsWithState = async () => {
        try {
            const response = await axios.post(getTagsForUserURL, { user_token: token });
            setTags(response.data);
        } catch (error) {
            if (__DEV__) console.error('Error fetching tags:', error);
        }
    };

    const fetchContactsWithState = async (filterState: any) => {
        const location = await getCurrentLocation();

        const requestBody = {
            user_token: token,
            search_params: {
                query_string: filterState.searchQuery,
                order_by: filterState.selectedSortOption,
                tags: filterState.selectedTags,
                lower_bound_date: formatDateForAPI(filterState.dateLowerBound),
                upper_bound_date: formatDateForAPI(filterState.dateUpperBound),
                user_lat: location.latitude,
                user_lon: location.longitude,
            },
        };

        try {
            setLoading(true);
            const response = await axios.post(searchContactsURL, requestBody);
            setContacts(response.data);
            setLoading(false);
            setSearchError('');
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                if (error.response.status === 401) {
                    setSearchError('Invalid user token, try logging in again.');
                } else {
                    setSearchError(`Server error: ${error.response.status}`);
                }
            } else {
                setSearchError('Network error');
            }
            setContacts([]);
            setLoading(false);
        }
    };

    const fetchContacts = async () => {
        await fetchContactsWithState({
            searchQuery,
            selectedTags,
            selectedSortOption,
            dateLowerBound,
            dateUpperBound,
        });
    };

    const fetchAll = async () => {
        await fetchTagsWithState();
        await fetchContacts();
    };

    const toggleTag = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    const filteredTags = tags.filter(t =>
        t.toLowerCase().includes(tagSearch.toLowerCase())
    );

    const activeFilterCount =
        (selectedTags.length > 0 ? 1 : 0) +
        (!isDateUnset(dateLowerBound) ? 1 : 0) +
        (!isDateToday(dateUpperBound) ? 1 : 0) +
        (selectedSortOption !== sortOptions[0] ? 1 : 0);

    return (
        <View style={CONTAINER_STYLES.screen} backgroundColor="$background">
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchAll} />}
                contentInsetAdjustmentBehavior="automatic"
            >
                <YStack>
                    {/* Search Bar Row */}
                    <XStack
                        alignItems="center"
                        space={SPACING.sm}
                        width="100%"
                        padding={SPACING.md}
                    >
                        <Button
                            size="$3"
                            onPress={() => setFilterSheetOpen(true)}
                            icon={<Ionicons name="options-outline" size={16} />}
                            variant="outlined"
                            fontSize={TYPOGRAPHY.sizes.sm}
                        >
                            {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'}
                        </Button>

                        <XStack
                            flex={1}
                            alignItems="center"
                            borderWidth={1}
                            borderColor="$borderColor"
                            borderRadius={BORDER_RADIUS.md}
                            backgroundColor="$background"
                        >
                            <Input
                                size="$3"
                                flex={1}
                                placeholder="Search contacts..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                onSubmitEditing={() => {
                                    Keyboard.dismiss();
                                    fetchContacts();
                                }}
                                returnKeyType="search"
                                borderWidth={0}
                                backgroundColor="transparent"
                            />
                        </XStack>
                    </XStack>

                    {/* Unified Filter Sheet */}
                    <Sheet
                        modal
                        open={filterSheetOpen}
                        onOpenChange={setFilterSheetOpen}
                        dismissOnOverlayPress
                        snapPoints={[75]}
                        zIndex={100000}
                    >
                        <Sheet.Overlay
                            animation="lazy"
                            enterStyle={{ opacity: 0 }}
                            exitStyle={{ opacity: 0 }}
                        />
                        <Sheet.Frame backgroundColor="$background" padding="$2" flex={1}>
                            <Sheet.Handle backgroundColor="$gray8" />
                            <ScrollView>
                                <YStack space={SPACING.lg} padding={SPACING.lg}>

                                    {/* Sort by — collapsible dropdown */}
                                    <YStack space={SPACING.sm}>
                                        <Text
                                            fontSize={TYPOGRAPHY.sizes.md}
                                            fontWeight={TYPOGRAPHY.weights.medium}
                                            color="$gray11"
                                        >
                                            Sort by
                                        </Text>

                                        {/* Trigger */}
                                        <Pressable onPress={() => setSortExpanded(v => !v)}>
                                            <XStack
                                                alignItems="center"
                                                justifyContent="space-between"
                                                padding={SPACING.sm}
                                                borderWidth={1}
                                                borderColor="$borderColor"
                                                borderRadius={BORDER_RADIUS.md}
                                                backgroundColor="$gray1"
                                            >
                                                <Text fontSize={TYPOGRAPHY.sizes.sm} color="$gray11">
                                                    {selectedSortOption}
                                                </Text>
                                                <ChevronDown
                                                    size={16}
                                                    color="$gray8"
                                                    style={{ transform: [{ rotate: sortExpanded ? '180deg' : '0deg' }] }}
                                                />
                                            </XStack>
                                        </Pressable>

                                        {/* Options list */}
                                        {sortExpanded && (
                                            <YStack
                                                borderWidth={1}
                                                borderColor="$borderColor"
                                                borderRadius={BORDER_RADIUS.md}
                                                backgroundColor="$gray1"
                                                overflow="hidden"
                                            >
                                                {sortOptions.map((option, index) => (
                                                    <Pressable
                                                        key={option}
                                                        onPress={() => {
                                                            setSelectedSortOption(option);
                                                            setSortExpanded(false);
                                                        }}
                                                    >
                                                        <XStack
                                                            alignItems="center"
                                                            space={SPACING.sm}
                                                            paddingHorizontal={SPACING.md}
                                                            paddingVertical={SPACING.sm}
                                                            backgroundColor={selectedSortOption === option ? '$blue2' : 'transparent'}
                                                            borderBottomWidth={index < sortOptions.length - 1 ? 1 : 0}
                                                            borderBottomColor="$borderColor"
                                                        >
                                                            <View
                                                                width={18}
                                                                height={18}
                                                                borderRadius={9}
                                                                borderWidth={2}
                                                                borderColor={selectedSortOption === option ? '$blue9' : '$gray7'}
                                                                backgroundColor={selectedSortOption === option ? '$blue9' : 'transparent'}
                                                                alignItems="center"
                                                                justifyContent="center"
                                                            >
                                                                {selectedSortOption === option && (
                                                                    <View
                                                                        width={7}
                                                                        height={7}
                                                                        borderRadius={4}
                                                                        backgroundColor="white"
                                                                    />
                                                                )}
                                                            </View>
                                                            <Text
                                                                fontSize={TYPOGRAPHY.sizes.sm}
                                                                fontWeight={selectedSortOption === option ? TYPOGRAPHY.weights.medium : TYPOGRAPHY.weights.normal}
                                                                color={selectedSortOption === option ? '$blue11' : '$color'}
                                                            >
                                                                {option}
                                                            </Text>
                                                        </XStack>
                                                    </Pressable>
                                                ))}
                                            </YStack>
                                        )}
                                    </YStack>

                                    {/* Filter by tags — search + capped chip area */}
                                    {tags.length > 0 && (
                                        <YStack space={SPACING.sm}>
                                            <XStack justifyContent="space-between" alignItems="center">
                                                <Text
                                                    fontSize={TYPOGRAPHY.sizes.md}
                                                    fontWeight={TYPOGRAPHY.weights.medium}
                                                    color="$gray11"
                                                >
                                                    Filter by tags
                                                </Text>
                                                {selectedTags.length > 0 && (
                                                    <Button
                                                        size="$2"
                                                        variant="outlined"
                                                        onPress={() => setSelectedTags([])}
                                                        borderRadius={BORDER_RADIUS.md}
                                                    >
                                                        Clear
                                                    </Button>
                                                )}
                                            </XStack>
                                            <YStack
                                                borderWidth={1}
                                                borderColor="$borderColor"
                                                borderRadius={BORDER_RADIUS.md}
                                                backgroundColor="$gray1"
                                                overflow="hidden"
                                            >
                                                <Input
                                                    size="$3"
                                                    placeholder="Search tags..."
                                                    value={tagSearch}
                                                    onChangeText={setTagSearch}
                                                    borderWidth={0}
                                                    borderBottomWidth={1}
                                                    borderBottomColor="$borderColor"
                                                    borderRadius={0}
                                                    backgroundColor="transparent"
                                                />
                                                <ScrollView
                                                    style={{ maxHeight: 108 }}
                                                    nestedScrollEnabled
                                                >
                                                    <XStack
                                                        flexWrap="wrap"
                                                        gap={SPACING.xs}
                                                        padding={SPACING.sm}
                                                    >
                                                        {filteredTags.map((tag) => (
                                                            <Pressable key={tag} onPress={() => toggleTag(tag)}>
                                                                <View
                                                                    paddingHorizontal={SPACING.sm}
                                                                    paddingVertical={SPACING.xs}
                                                                    borderRadius={99}
                                                                    borderWidth={1}
                                                                    borderColor={selectedTags.includes(tag) ? '$blue9' : '$borderColor'}
                                                                    backgroundColor={selectedTags.includes(tag) ? '$blue9' : '$background'}
                                                                >
                                                                    <Text
                                                                        fontSize={TYPOGRAPHY.sizes.sm}
                                                                        color={selectedTags.includes(tag) ? 'white' : '$gray11'}
                                                                        fontWeight={selectedTags.includes(tag) ? TYPOGRAPHY.weights.medium : TYPOGRAPHY.weights.normal}
                                                                    >
                                                                        {tag}
                                                                    </Text>
                                                                </View>
                                                            </Pressable>
                                                        ))}
                                                    </XStack>
                                                </ScrollView>
                                            </YStack>
                                        </YStack>
                                    )}

                                    {/* Date range section */}
                                    <YStack space={SPACING.sm}>
                                        <Text
                                            fontSize={TYPOGRAPHY.sizes.md}
                                            fontWeight={TYPOGRAPHY.weights.medium}
                                            color="$gray11"
                                        >
                                            Last contact date range
                                        </Text>
                                        <XStack space={SPACING.md}>
                                            <YStack space={SPACING.xs} flex={1}>
                                                <Text
                                                    fontSize={TYPOGRAPHY.sizes.sm}
                                                    fontWeight={TYPOGRAPHY.weights.medium}
                                                    color="$gray10"
                                                >
                                                    After
                                                </Text>
                                                <DatePickerModal
                                                    value={isDateUnset(dateLowerBound) ? null : dateLowerBound}
                                                    onChange={setDateLowerBound}
                                                    placeholder="No lower bound"
                                                    textColor={isDateUnset(dateLowerBound) ? '$gray9' : '$color'}
                                                />
                                                <Button
                                                    size="$2"
                                                    variant="outlined"
                                                    disabled={isDateUnset(dateLowerBound)}
                                                    onPress={() => setDateLowerBound(new Date(0))}
                                                    fontSize={TYPOGRAPHY.sizes.xs}
                                                >
                                                    Reset
                                                </Button>
                                            </YStack>
                                            <YStack space={SPACING.xs} flex={1}>
                                                <Text
                                                    fontSize={TYPOGRAPHY.sizes.sm}
                                                    fontWeight={TYPOGRAPHY.weights.medium}
                                                    color="$gray10"
                                                >
                                                    Before
                                                </Text>
                                                <DatePickerModal
                                                    value={dateUpperBound}
                                                    onChange={setDateUpperBound}
                                                />
                                                <Button
                                                    size="$2"
                                                    variant="outlined"
                                                    disabled={isDateToday(dateUpperBound)}
                                                    onPress={() => setDateUpperBound(new Date(Date.now()))}
                                                    fontSize={TYPOGRAPHY.sizes.xs}
                                                >
                                                    Reset
                                                </Button>
                                            </YStack>
                                        </XStack>
                                    </YStack>

                                    {/* Apply / Cancel */}
                                    <XStack
                                        space={SPACING.sm}
                                        paddingTop={SPACING.sm}
                                        borderTopWidth={1}
                                        borderTopColor="$borderColor"
                                    >
                                        <Button
                                            size="$3"
                                            variant="outlined"
                                            onPress={() => setFilterSheetOpen(false)}
                                            borderRadius={BORDER_RADIUS.md}
                                            flex={1}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="$3"
                                            onPress={() => {
                                                setFilterSheetOpen(false);
                                                fetchContacts();
                                            }}
                                            backgroundColor="$blue9"
                                            color="white"
                                            borderRadius={BORDER_RADIUS.md}
                                            flex={1}
                                        >
                                            Apply
                                        </Button>
                                    </XStack>

                                </YStack>
                            </ScrollView>
                        </Sheet.Frame>
                    </Sheet>

                    <View style={{ paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md }}>
                        <Loader loading={loading}>
                            {searchError ? (
                                <Text color="$red9" marginTop={SPACING.sm}>
                                    {searchError}
                                </Text>
                            ) : null}
                            <ContactsList contacts={contacts} prefix="searchlist" />
                        </Loader>
                    </View>
                </YStack>
            </ScrollView>
        </View>
    );
}
