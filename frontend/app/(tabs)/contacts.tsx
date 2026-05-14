import { useState, useEffect } from 'react';
import ContactsList from '@/components/ContactsList'
import { ScrollView, YStack, Input, Button, XStack, Sheet, Text, View } from 'tamagui';
import { Loader } from '@/components/Loader';
import { searchContactsURL, getTagsForUserURL } from '@/constants/Apis';
import { useAuth } from '@/components/AuthContext';
import { Keyboard, Pressable, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChevronDown } from '@tamagui/lucide-icons';
import { getCurrentLocation } from '@/utils/locationutil';
import { SPACING, TYPOGRAPHY, CONTAINER_STYLES, BORDER_RADIUS } from '@/constants/Styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDateForAPI } from '@/utils/utilfunctions'
import { DatePickerModal } from '@/components/DatePickerModal';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/QueryKeys';

import axios from 'axios';

const FILTER_STATE_KEY = '@contacts_filter_state';

export default function ContactsScreen() {
    const sortOptions = [
        { label: 'Date added',              value: 'DATE_ADDED' },
        { label: 'Last contacted (newest)', value: 'LAST_CONTACT_NEWEST' },
        { label: 'Last contacted (oldest)', value: 'LAST_CONTACT_OLDEST' },
        { label: 'Alphabetical',            value: 'ALPHABETICAL' },
        { label: 'Distance',                value: 'DISTANCE' },
        { label: 'Relevance',               value: 'RELEVANCE' },
        { label: 'Next contact date',       value: 'NEXT_CONTACT_DATE' },
    ];

    const { token } = useAuth();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedSortOption, setSelectedSortOption] = useState(sortOptions[0].value);
    const [dateLowerBound, setDateLowerBound] = useState(new Date(0));
    const [dateUpperBound, setDateUpperBound] = useState(new Date(Date.now()));
    const [filterStateLoaded, setFilterStateLoaded] = useState(false);

    const [filterSheetOpen, setFilterSheetOpen] = useState(false);
    const [sortExpanded, setSortExpanded] = useState(false);
    const [tagSearch, setTagSearch] = useState('');

    // Load saved filter state once on mount
    useEffect(() => {
        const loadFilterState = async () => {
            try {
                const savedState = await AsyncStorage.getItem(FILTER_STATE_KEY);
                if (savedState) {
                    const parsed = JSON.parse(savedState);
                    setSearchQuery(parsed.searchQuery || '');
                    setSelectedTags(parsed.selectedTags || []);
                    setSelectedSortOption(parsed.selectedSortOption || sortOptions[0].value);
                    setDateLowerBound(parsed.dateLowerBound ? new Date(parsed.dateLowerBound) : new Date(0));
                    setDateUpperBound(parsed.dateUpperBound ? new Date(parsed.dateUpperBound) : new Date(Date.now()));
                }
            } catch (error) {
                if (__DEV__) console.error('Error loading filter state:', error);
            } finally {
                setFilterStateLoaded(true);
            }
        };
        loadFilterState();
    }, []);

    // Persist filter state whenever it changes
    useEffect(() => {
        if (!filterStateLoaded) return;
        const saveFilterState = async () => {
            try {
                await AsyncStorage.setItem(FILTER_STATE_KEY, JSON.stringify({
                    searchQuery,
                    selectedTags,
                    selectedSortOption,
                    dateLowerBound: dateLowerBound.toISOString(),
                    dateUpperBound: dateUpperBound.toISOString(),
                }));
            } catch (error) {
                if (__DEV__) console.error('Error saving filter state:', error);
            }
        };
        saveFilterState();
    }, [searchQuery, selectedTags, selectedSortOption, dateLowerBound, dateUpperBound, filterStateLoaded]);

    const filterParams = {
        query_string: searchQuery,
        order_by: selectedSortOption,
        tags: selectedTags,
        lower_bound_date: formatDateForAPI(dateLowerBound),
        upper_bound_date: formatDateForAPI(dateUpperBound),
    };

    const { data: contacts = [], isFetching, refetch, isError } = useQuery({
        queryKey: queryKeys.contacts(filterParams),
        queryFn: async () => {
            const location = await getCurrentLocation();
            const response = await axios.post(searchContactsURL, {
                user_token: token,
                search_params: {
                    ...filterParams,
                    user_lat: location.latitude,
                    user_lon: location.longitude,
                },
            });
            return response.data;
        },
        enabled: filterStateLoaded,
    });

    const { data: tags = [] } = useQuery({
        queryKey: queryKeys.tags(),
        queryFn: async () => {
            const response = await axios.post(getTagsForUserURL, { user_token: token });
            return response.data;
        },
        enabled: filterStateLoaded,
    });

    function isDateUnset(date: Date): boolean {
        return String(date) === String(new Date(0));
    }

    function isDateToday(date: Date): boolean {
        return String(date) === String(new Date(Date.now()));
    }

    const toggleTag = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    const filteredTags = tags.filter((t: string) =>
        t.toLowerCase().includes(tagSearch.toLowerCase())
    );

    const activeFilterCount =
        (selectedTags.length > 0 ? 1 : 0) +
        (!isDateUnset(dateLowerBound) ? 1 : 0) +
        (!isDateToday(dateUpperBound) ? 1 : 0) +
        (selectedSortOption !== sortOptions[0].value ? 1 : 0);

    return (
        <View style={CONTAINER_STYLES.screen} backgroundColor="$background">
            <ScrollView
                refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
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
                                onSubmitEditing={() => Keyboard.dismiss()}
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
                                                    {sortOptions.find(o => o.value === selectedSortOption)?.label}
                                                </Text>
                                                <ChevronDown
                                                    size={16}
                                                    color="$gray8"
                                                    style={{ transform: [{ rotate: sortExpanded ? '180deg' : '0deg' }] }}
                                                />
                                            </XStack>
                                        </Pressable>

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
                                                        key={option.value}
                                                        onPress={() => {
                                                            setSelectedSortOption(option.value);
                                                            setSortExpanded(false);
                                                        }}
                                                    >
                                                        <XStack
                                                            alignItems="center"
                                                            space={SPACING.sm}
                                                            paddingHorizontal={SPACING.md}
                                                            paddingVertical={SPACING.sm}
                                                            backgroundColor={selectedSortOption === option.value ? '$blue2' : 'transparent'}
                                                            borderBottomWidth={index < sortOptions.length - 1 ? 1 : 0}
                                                            borderBottomColor="$borderColor"
                                                        >
                                                            <View
                                                                width={18}
                                                                height={18}
                                                                borderRadius={9}
                                                                borderWidth={2}
                                                                borderColor={selectedSortOption === option.value ? '$blue9' : '$gray7'}
                                                                backgroundColor={selectedSortOption === option.value ? '$blue9' : 'transparent'}
                                                                alignItems="center"
                                                                justifyContent="center"
                                                            >
                                                                {selectedSortOption === option.value && (
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
                                                                fontWeight={selectedSortOption === option.value ? TYPOGRAPHY.weights.medium : TYPOGRAPHY.weights.normal}
                                                                color={selectedSortOption === option.value ? '$blue11' : '$color'}
                                                            >
                                                                {option.label}
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
                                                        {filteredTags.map((tag: string) => (
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
                                            onPress={() => setFilterSheetOpen(false)}
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

                    <View style={{ paddingBottom: SPACING.md }}>
                        <Loader loading={isFetching && contacts.length === 0}>
                            {isError ? (
                                <Text color="$red9" marginTop={SPACING.sm}>
                                    Could not load contacts
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
