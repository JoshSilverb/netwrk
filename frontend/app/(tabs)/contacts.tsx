import { useState, useEffect, useRef, useCallback } from 'react';
import ContactsList from '@/components/ContactsList'
import { ScrollView, YStack, Input, XStack, Sheet, Text, View } from 'tamagui';
import { Loader } from '@/components/Loader';
import { searchContactsURL, getTagsForUserURL } from '@/constants/Apis';
import { useAuth } from '@/components/AuthContext';
import { Keyboard, Pressable, RefreshControl, ScrollView as RNScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChevronDown, ArrowUpDown } from '@tamagui/lucide-icons';
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

    const [dateSheetOpen, setDateSheetOpen] = useState(false);
    const [tagSheetOpen, setTagSheetOpen] = useState(false);
    const [sortSheetOpen, setSortSheetOpen] = useState(false);
    const [tagSearch, setTagSearch] = useState('');

    const [debouncedQuery, setDebouncedQuery] = useState('');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearchChange = useCallback((text: string) => {
        setSearchQuery(text);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setDebouncedQuery(text), 350);
    }, []);

    useEffect(() => {
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, []);

    // Load saved filter state once on mount
    useEffect(() => {
        const loadFilterState = async () => {
            try {
                const savedState = await AsyncStorage.getItem(FILTER_STATE_KEY);
                if (savedState) {
                    const parsed = JSON.parse(savedState);
                    setSearchQuery(parsed.searchQuery || '');
                    setDebouncedQuery(parsed.searchQuery || '');
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

    const isShortQuery = searchQuery.trim().split(/\s+/).filter(Boolean).length <= 2;
    const searchMode: 'Name' | 'Semantic' =
        isShortQuery && selectedSortOption !== 'RELEVANCE' ? 'Name' : 'Semantic';

    const effectiveSortOption =
        searchMode === 'Semantic' ? 'RELEVANCE' : selectedSortOption;

    const filterParams = {
        query_string: searchMode === 'Semantic' ? debouncedQuery : '',
        order_by: effectiveSortOption,
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

    const displayedContacts =
        searchMode === 'Name' && searchQuery.trim()
            ? contacts.filter((c: any) =>
                c.fullname?.toLowerCase().includes(searchQuery.toLowerCase())
              )
            : contacts;

    const { data: tags = [] } = useQuery({
        queryKey: queryKeys.tags(),
        queryFn: async () => {
            const response = await axios.post(getTagsForUserURL, { user_token: token });
            return response.data;
        },
        enabled: filterStateLoaded,
    });

    function isDateUnset(date: Date): boolean {
        return date.getTime() === 0;
    }

    function isDateToday(date: Date): boolean {
        const today = new Date();
        return date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate();
    }

    const toggleTag = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    const filteredTags = tags.filter((t: string) =>
        t.toLowerCase().includes(tagSearch.toLowerCase())
    );

    const hasActiveDates = !isDateUnset(dateLowerBound) || !isDateToday(dateUpperBound);

    return (
        <View style={CONTAINER_STYLES.screen} backgroundColor="$background">
            <ScrollView
                refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
                contentInsetAdjustmentBehavior="automatic"
            >
                <YStack>
                    {/* ── Row 1: Full-width search bar ── */}
                    <XStack
                        paddingHorizontal={SPACING.md}
                        paddingTop={14}
                        paddingBottom={6}
                    >
                        <XStack
                            flex={1}
                            alignItems="center"
                            backgroundColor="$background"
                            style={{
                                borderWidth: 1,
                                borderColor: searchQuery.length > 0 ? '#14B8A6' : '#e2e8f0',
                                borderRadius: 10,
                                shadowColor: '#14B8A6',
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: searchQuery.length > 0 ? 0.15 : 0,
                                shadowRadius: 6,
                            }}
                        >
                            <View style={{ paddingLeft: 10 }}>
                                <Ionicons
                                    name="search-outline"
                                    size={15}
                                    color={searchQuery.length > 0 ? '#14B8A6' : '#94a3b8'}
                                />
                            </View>
                            <Input
                                flex={1}
                                size="$3"
                                placeholder="Search or describe a contact…"
                                value={searchQuery}
                                onChangeText={handleSearchChange}
                                onSubmitEditing={() => Keyboard.dismiss()}
                                returnKeyType="search"
                                borderWidth={0}
                                backgroundColor="transparent"
                            />
                            {searchQuery.length > 0 && (
                                <View style={{
                                    marginRight: 8,
                                    paddingHorizontal: 7,
                                    paddingVertical: 3,
                                    borderRadius: 4,
                                    borderWidth: 1,
                                    backgroundColor: searchMode === 'Semantic'
                                        ? 'rgba(20,184,166,0.08)'
                                        : 'rgba(15,23,42,0.06)',
                                    borderColor: searchMode === 'Semantic'
                                        ? 'rgba(20,184,166,0.3)'
                                        : 'rgba(15,23,42,0.15)',
                                }}>
                                    <Text style={{
                                        fontSize: 9,
                                        letterSpacing: 1.2,
                                        textTransform: 'uppercase',
                                        fontWeight: '600',
                                        color: searchMode === 'Semantic' ? '#14B8A6' : '#0F172A',
                                    }}>
                                        {searchMode}
                                    </Text>
                                </View>
                            )}
                        </XStack>
                    </XStack>

                    {/* ── Row 2: Sort + filter chips ── */}
                    <RNScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{
                            paddingHorizontal: SPACING.md,
                            paddingBottom: 10,
                            gap: 6,
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}
                    >
                        {/* Sort pill — navy filled, always present */}
                        <Pressable onPress={() => setSortSheetOpen(true)}>
                            <XStack alignItems="center" gap={5} style={{
                                paddingHorizontal: 11, paddingVertical: 5,
                                borderRadius: 20,
                                backgroundColor: '#0F172A',
                            }}>
                                <ArrowUpDown size={11} color="#ffffff" />
                                <Text style={{ fontSize: 12, fontWeight: '500', color: '#ffffff' }}>
                                    {sortOptions.find(o => o.value === effectiveSortOption)?.label}
                                </Text>
                                <ChevronDown size={10} color="rgba(255,255,255,0.7)" />
                            </XStack>
                        </Pressable>

                        {/* Date chip */}
                        <Pressable onPress={() => setDateSheetOpen(true)}>
                            <XStack alignItems="center" gap={3} style={{
                                paddingHorizontal: 10, paddingVertical: 5,
                                borderRadius: 20, borderWidth: 1,
                                borderColor: hasActiveDates ? 'rgba(20,184,166,0.4)' : '#e2e8f0',
                                backgroundColor: hasActiveDates ? 'rgba(20,184,166,0.08)' : 'transparent',
                            }}>
                                {hasActiveDates && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#14B8A6' }} />}
                                <Ionicons name="calendar-outline" size={11} color={hasActiveDates ? '#0d9488' : '#94a3b8'} />
                                <Text style={{ fontSize: 12, fontWeight: hasActiveDates ? '500' : '400', color: hasActiveDates ? '#0d9488' : '#64748b' }}>
                                    {hasActiveDates ? 'Date set' : 'Date'}
                                </Text>
                                <ChevronDown size={10} color={hasActiveDates ? '#0d9488' : '#94a3b8'} />
                            </XStack>
                        </Pressable>

                        {/* + Tag chip — opens tag sheet */}
                        <Pressable onPress={() => { setTagSearch(''); setTagSheetOpen(true); }}>
                            <XStack alignItems="center" gap={3} style={{
                                paddingHorizontal: 10, paddingVertical: 5,
                                borderRadius: 20, borderWidth: 1,
                                borderColor: selectedTags.length > 0 ? 'rgba(20,184,166,0.4)' : '#e2e8f0',
                                backgroundColor: selectedTags.length > 0 ? 'rgba(20,184,166,0.08)' : 'transparent',
                            }}>
                                {selectedTags.length > 0 && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#14B8A6' }} />}
                                <Text style={{ fontSize: 12, fontWeight: selectedTags.length > 0 ? '500' : '400', color: selectedTags.length > 0 ? '#0d9488' : '#64748b' }}>
                                    {selectedTags.length > 0 ? `Tags (${selectedTags.length})` : '+ Tags'}
                                </Text>
                                <ChevronDown size={10} color={selectedTags.length > 0 ? '#0d9488' : '#94a3b8'} />
                            </XStack>
                        </Pressable>

                        {/* Active tag dismissal chips */}
                        {selectedTags.map((tag: string) => (
                            <Pressable key={tag} onPress={() => toggleTag(tag)}>
                                <XStack alignItems="center" gap={4} style={{
                                    paddingHorizontal: 10, paddingVertical: 5,
                                    borderRadius: 20, borderWidth: 1,
                                    borderColor: 'rgba(20,184,166,0.4)',
                                    backgroundColor: 'rgba(20,184,166,0.08)',
                                }}>
                                    <Text style={{ fontSize: 12, fontWeight: '500', color: '#0d9488' }}>{tag}</Text>
                                    <Ionicons name="close" size={11} color="#0d9488" />
                                </XStack>
                            </Pressable>
                        ))}
                    </RNScrollView>

                    {/* ── Tag Sheet ── */}
                    <Sheet
                        modal
                        open={tagSheetOpen}
                        onOpenChange={setTagSheetOpen}
                        dismissOnOverlayPress
                        snapPoints={[55]}
                        zIndex={100000}
                    >
                        <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
                        <Sheet.Frame backgroundColor="$background" padding="$2" flex={1}>
                            <Sheet.Handle backgroundColor="$gray6" />
                            <YStack gap={12} padding={SPACING.lg}>
                                <XStack justifyContent="space-between" alignItems="center">
                                    <Text style={{ fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: '600', color: '#94a3b8' }}>
                                        Tags
                                    </Text>
                                    {selectedTags.length > 0 && (
                                        <Pressable onPress={() => setSelectedTags([])}>
                                            <Text style={{ fontSize: 12, color: '#14B8A6', fontWeight: '500' }}>Clear all</Text>
                                        </Pressable>
                                    )}
                                </XStack>
                                <View style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                                    <Input
                                        size="$3"
                                        placeholder="Search tags…"
                                        value={tagSearch}
                                        onChangeText={setTagSearch}
                                        borderWidth={0}
                                        borderBottomWidth={1}
                                        borderBottomColor="$borderColor"
                                        borderRadius={0}
                                        backgroundColor="transparent"
                                    />
                                    <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
                                        <XStack flexWrap="wrap" gap={6} padding={10}>
                                            {filteredTags.map((tag: string) => {
                                                const isActive = selectedTags.includes(tag);
                                                return (
                                                    <Pressable key={tag} onPress={() => toggleTag(tag)}>
                                                        <View style={{
                                                            paddingHorizontal: 10, paddingVertical: 5,
                                                            borderRadius: 20, borderWidth: 1,
                                                            borderColor: isActive ? 'rgba(20,184,166,0.4)' : '#e2e8f0',
                                                            backgroundColor: isActive ? 'rgba(20,184,166,0.08)' : 'transparent',
                                                        }}>
                                                            <Text style={{ fontSize: 12, fontWeight: isActive ? '600' : '400', color: isActive ? '#0d9488' : '#374151' }}>
                                                                {tag}
                                                            </Text>
                                                        </View>
                                                    </Pressable>
                                                );
                                            })}
                                        </XStack>
                                    </ScrollView>
                                </View>
                                <Pressable onPress={() => setTagSheetOpen(false)}>
                                    <View style={{ paddingVertical: 12, borderRadius: 8, backgroundColor: '#0F172A', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: 'white' }}>Done</Text>
                                    </View>
                                </Pressable>
                            </YStack>
                        </Sheet.Frame>
                    </Sheet>

                    {/* ── Date Range Sheet ── */}
                    <Sheet
                        modal
                        open={dateSheetOpen}
                        onOpenChange={setDateSheetOpen}
                        dismissOnOverlayPress
                        snapPoints={[45]}
                        zIndex={100000}
                    >
                        <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
                        <Sheet.Frame backgroundColor="$background" padding="$2" flex={1}>
                            <Sheet.Handle backgroundColor="$gray6" />
                            <YStack gap={SPACING.md} padding={SPACING.lg}>
                                <Text style={{ fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: '600', color: '#94a3b8' }}>
                                    Last contact date
                                </Text>
                                <XStack gap={SPACING.md}>
                                    <YStack gap={SPACING.xs} flex={1}>
                                        <Text style={{ fontSize: 11, fontWeight: '500', letterSpacing: 0.6, textTransform: 'uppercase', color: '#64748b' }}>
                                            After
                                        </Text>
                                        <DatePickerModal
                                            value={isDateUnset(dateLowerBound) ? null : dateLowerBound}
                                            onChange={setDateLowerBound}
                                            placeholder="Any time"
                                            textColor={isDateUnset(dateLowerBound) ? '$gray9' : '$color'}
                                        />
                                        <Pressable disabled={isDateUnset(dateLowerBound)} onPress={() => setDateLowerBound(new Date(0))}>
                                            <Text style={{ fontSize: 11, fontWeight: '500', color: isDateUnset(dateLowerBound) ? '#cbd5e1' : '#14B8A6' }}>
                                                Reset
                                            </Text>
                                        </Pressable>
                                    </YStack>
                                    <YStack gap={SPACING.xs} flex={1}>
                                        <Text style={{ fontSize: 11, fontWeight: '500', letterSpacing: 0.6, textTransform: 'uppercase', color: '#64748b' }}>
                                            Before
                                        </Text>
                                        <DatePickerModal
                                            value={dateUpperBound}
                                            onChange={setDateUpperBound}
                                        />
                                        <Pressable disabled={isDateToday(dateUpperBound)} onPress={() => setDateUpperBound(new Date(Date.now()))}>
                                            <Text style={{ fontSize: 11, fontWeight: '500', color: isDateToday(dateUpperBound) ? '#cbd5e1' : '#14B8A6' }}>
                                                Reset
                                            </Text>
                                        </Pressable>
                                    </YStack>
                                </XStack>
                                <XStack gap={SPACING.sm} style={{ borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: SPACING.sm }}>
                                    <Pressable style={{ flex: 1 }} onPress={() => { setDateLowerBound(new Date(0)); setDateUpperBound(new Date(Date.now())); }}>
                                        <View style={{ paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' }}>
                                            <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>Clear</Text>
                                        </View>
                                    </Pressable>
                                    <Pressable style={{ flex: 1 }} onPress={() => setDateSheetOpen(false)}>
                                        <View style={{ paddingVertical: 12, borderRadius: 8, backgroundColor: '#0F172A', alignItems: 'center' }}>
                                            <Text style={{ fontSize: 14, fontWeight: '600', color: 'white' }}>Done</Text>
                                        </View>
                                    </Pressable>
                                </XStack>
                            </YStack>
                        </Sheet.Frame>
                    </Sheet>

                    {/* ── Sort Sheet ── */}
                    <Sheet
                        modal
                        open={sortSheetOpen}
                        onOpenChange={setSortSheetOpen}
                        dismissOnOverlayPress
                        snapPoints={[45]}
                        zIndex={100000}
                    >
                        <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
                        <Sheet.Frame backgroundColor="$background" padding="$2" flex={1}>
                            <Sheet.Handle backgroundColor="$gray6" />
                            <YStack gap={12} padding={SPACING.lg}>
                                <Text style={{ fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: '600', color: '#94a3b8' }}>
                                    Sort by
                                </Text>
                                {sortOptions.map((option) => (
                                    <Pressable key={option.value} onPress={() => {
                                        setSelectedSortOption(option.value);
                                        setSortSheetOpen(false);
                                    }}>
                                        <XStack alignItems="center" gap={12} style={{
                                            paddingVertical: 10,
                                            borderBottomWidth: 1,
                                            borderBottomColor: '#f1f5f9',
                                        }}>
                                            <View style={{
                                                width: 16, height: 16, borderRadius: 8,
                                                borderWidth: 1.5,
                                                borderColor: selectedSortOption === option.value ? '#14B8A6' : '#cbd5e1',
                                                backgroundColor: selectedSortOption === option.value ? '#14B8A6' : 'transparent',
                                                alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                {selectedSortOption === option.value && (
                                                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#ffffff' }} />
                                                )}
                                            </View>
                                            <Text style={{
                                                fontSize: 14,
                                                fontWeight: selectedSortOption === option.value ? '500' : '400',
                                                color: selectedSortOption === option.value ? '#0F172A' : '#64748b',
                                            }}>
                                                {option.label}
                                            </Text>
                                        </XStack>
                                    </Pressable>
                                ))}
                            </YStack>
                        </Sheet.Frame>
                    </Sheet>

                    <View style={{ paddingBottom: SPACING.md }}>
                        <Loader loading={isFetching && contacts.length === 0}>
                            {isError ? (
                                <Text color="$red9" marginTop={SPACING.sm}>
                                    Could not load contacts
                                </Text>
                            ) : null}
                            <ContactsList contacts={displayedContacts} prefix="searchlist" />
                        </Loader>
                    </View>
                </YStack>
            </ScrollView>
        </View>
    );
}
