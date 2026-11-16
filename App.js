
import React, { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
  StatusBar,
} from 'react-native';

const STORAGE_KEY = 'menuItems';
const COURSES = ['Starter', 'Main Course', 'Dessert'];

const COLORS = {
  forest: '#173D32',
  forestLight: '#245747',
  cream: '#F5F3EC',
  white: '#FFFFFF',
  gold: '#C6A66A',
  ink: '#202C26',
  muted: '#788078',
  border: '#E7E5DC',
  paleGreen: '#EAF0E9',
  red: '#B94A48',
  paleRed: '#F9EAE7',
};

function formatPrice(value) {
  return `R ${Number(value || 0).toFixed(2)}`;
}

function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <View style={styles.sectionHeading}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.pageTitle}>{title}</Text>
      {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function StatCard({ label, value, detail, symbol }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statTopRow}>
        <Text style={styles.statSymbol}>{symbol}</Text>
        <View style={styles.statDot} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {detail ? <Text style={styles.statDetail}>{detail}</Text> : null}
    </View>
  );
}

function CourseBadge({ course }) {
  return (
    <View style={styles.courseBadge}>
      <Text style={styles.courseBadgeText}>{course}</Text>
    </View>
  );
}

function NavigationItem({ label, symbol, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.navItem, active && styles.navItemActive]}
    >
      <Text style={[styles.navSymbol, active && styles.navTextActive]}>
        {symbol}
      </Text>
      <Text style={[styles.navLabel, active && styles.navTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function App() {
  const [menuItems, setMenuItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [activeScreen, setActiveScreen] = useState('Dashboard');
  const [feedback, setFeedback] = useState(null);

  const [dishName, setDishName] = useState('');
  const [description, setDescription] = useState('');
  const [course, setCourse] = useState('Starter');
  const [price, setPrice] = useState('');
  const [editingItemId, setEditingItemId] = useState(null);

  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [itemToDelete, setItemToDelete] = useState(null);

  // Load the existing Part 2 menu from local storage.
  useEffect(() => {
    const loadMenu = async () => {
      try {
        const savedMenu = await AsyncStorage.getItem(STORAGE_KEY);

        if (savedMenu) {
          const parsedMenu = JSON.parse(savedMenu);

          if (Array.isArray(parsedMenu)) {
            setMenuItems(parsedMenu);
          }
        }
      } catch (error) {
        console.log('Unable to load menu:', error);
        setFeedback({
          type: 'error',
          message: 'Your saved menu could not be loaded.',
        });
      } finally {
        setIsLoaded(true);
      }
    };

    loadMenu();
  }, []);

  // Save every menu change after the first load.
  useEffect(() => {
    if (!isLoaded) return;

    const saveMenu = async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(menuItems)
        );
      } catch (error) {
        console.log('Unable to save menu:', error);
        setFeedback({
          type: 'error',
          message: 'Your menu changes could not be saved.',
        });
      }
    };

    saveMenu();
  }, [menuItems, isLoaded]);

  // Menu statistics.
  const totalItems = menuItems.length;

  const averagePrice = totalItems > 0
    ? menuItems.reduce(
        (total, item) => total + Number(item.price || 0),
        0
      ) / totalItems
    : 0;

  const courseCounts = useMemo(() => {
    return {
      Starter: menuItems.filter(
        (item) => item.course === 'Starter'
      ).length,
      'Main Course': menuItems.filter(
        (item) => item.course === 'Main Course'
      ).length,
      Dessert: menuItems.filter(
        (item) => item.course === 'Dessert'
      ).length,
    };
  }, [menuItems]);

  // Search and course filtering.
  const filteredItems = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    return menuItems.filter((item) => {
      const nameMatches = (item.dishName || '')
        .toLowerCase()
        .includes(search);

      const courseMatches =
        selectedFilter === 'All' ||
        item.course === selectedFilter;

      return nameMatches && courseMatches;
    });
  }, [menuItems, searchText, selectedFilter]);

  // Reset the dish form.
  const resetForm = () => {
    setDishName('');
    setDescription('');
    setCourse('Starter');
    setPrice('');
    setEditingItemId(null);
  };

  // Open the form for a new menu item.
  const openNewItemForm = () => {
    resetForm();
    setFeedback(null);
    setActiveScreen('Editor');
  };

  // Save a new dish or update an existing one.
  const saveMenuItem = () => {
    if (
      !dishName.trim() ||
      !description.trim() ||
      !course ||
      !price.trim()
    ) {
      setFeedback({
        type: 'error',
        message: 'Please complete all required fields.',
      });
      return;
    }

    const numericPrice = Number(
      price.trim().replace(',', '.')
    );

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setFeedback({
        type: 'error',
        message: 'Enter a valid price greater than zero.',
      });
      return;
    }

    const updatedItem = {
      id: editingItemId || Date.now().toString(),
      dishName: dishName.trim(),
      description: description.trim(),
      course,
      price: numericPrice.toFixed(2),
    };

    if (editingItemId) {
      setMenuItems((items) =>
        items.map((item) =>
          String(item.id) === String(editingItemId)
            ? updatedItem
            : item
        )
      );

      setFeedback({
        type: 'success',
        message: 'Your menu item has been updated.',
      });
    } else {
      setMenuItems((items) => [updatedItem, ...items]);

      setFeedback({
        type: 'success',
        message: 'Your new dish has been added to the menu.',
      });
    }

    resetForm();
    setActiveScreen('Menu');
  };

  // Load an existing item into the editor.
  const editMenuItem = (item) => {
    setDishName(item.dishName || '');
    setDescription(item.description || '');
    setCourse(item.course || 'Starter');
    setPrice(String(item.price ?? ''));
    setEditingItemId(item.id);
    setFeedback(null);
    setActiveScreen('Editor');
  };

  // Delete an item after confirmation.
  const confirmDelete = () => {
    if (!itemToDelete) return;

    setMenuItems((items) =>
      items.filter(
        (item) =>
          String(item.id) !== String(itemToDelete.id)
      )
    );

    if (
      String(editingItemId) === String(itemToDelete.id)
    ) {
      resetForm();
    }

    setFeedback({
      type: 'success',
      message: `${itemToDelete.dishName} was removed from your menu.`,
    });

    setItemToDelete(null);
  };

  const clearSearch = () => {
    setSearchText('');
    setSelectedFilter('All');
  };

  // Reusable menu item card.
  const renderMenuCard = (item) => (
    <View key={String(item.id)} style={styles.menuCard}>
      <View style={styles.menuCardTop}>
        <View style={styles.menuCardTitleArea}>
          <Text style={styles.menuCardName}>
            {item.dishName}
          </Text>
          <CourseBadge course={item.course} />
        </View>

        <Text style={styles.menuCardPrice}>
          {formatPrice(item.price)}
        </Text>
      </View>

      <Text style={styles.menuCardDescription}>
        {item.description}
      </Text>

      <View style={styles.menuCardDivider} />

      <View style={styles.menuCardActions}>
        <Pressable
          style={styles.secondaryAction}
          onPress={() => editMenuItem(item)}
        >
          <Text style={styles.secondaryActionText}>
            Edit dish
          </Text>
        </Pressable>

        <Pressable
          style={styles.deleteAction}
          onPress={() => setItemToDelete(item)}
        >
          <Text style={styles.deleteActionText}>
            Delete
          </Text>
        </Pressable>
      </View>
    </View>
  );

  // Dashboard screen.
  const renderDashboard = () => (
    <View>
      <View style={styles.welcomeBanner}>
        <View style={styles.bannerTextArea}>
          <Text style={styles.bannerEyebrow}>
            YOUR RESTAURANT WORKSPACE
          </Text>
          <Text style={styles.bannerTitle}>
            Good food starts with a great menu.
          </Text>
          <Text style={styles.bannerDescription}>
            Keep your dishes organised, your prices clear
            and your menu up to date.
          </Text>

          <Pressable
            style={styles.bannerButton}
            onPress={openNewItemForm}
          >
            <Text style={styles.bannerButtonText}>
              + Create a dish
            </Text>
          </Pressable>
        </View>

        <View style={styles.bannerDecoration}>
          <Text style={styles.bannerDecorationText}>CM</Text>
        </View>
      </View>

      <View style={styles.contentSection}>
        <SectionHeading
          eyebrow="AT A GLANCE"
          title="Menu overview"
          subtitle="A quick look at your restaurant menu."
        />

        <View style={styles.statsGrid}>
          <StatCard
            symbol="▤"
            label="Total dishes"
            value={totalItems}
            detail="Items in your menu"
          />
          <StatCard
            symbol="R"
            label="Average price"
            value={formatPrice(averagePrice)}
            detail="Across all dishes"
          />
        </View>
      </View>

      <View style={styles.contentSection}>
        <SectionHeading
          eyebrow="MENU COMPOSITION"
          title="Courses"
          subtitle="Your dishes grouped by course."
        />

        <View style={styles.courseOverview}>
          {COURSES.map((courseName, index) => (
            <View key={courseName} style={styles.courseOverviewRow}>
              <View style={styles.courseOverviewLeft}>
                <View
                  style={[
                    styles.courseMarker,
                    index === 1 && styles.courseMarkerMiddle,
                    index === 2 && styles.courseMarkerLast,
                  ]}
                />
                <Text style={styles.courseOverviewName}>
                  {courseName}
                </Text>
              </View>
              <Text style={styles.courseOverviewCount}>
                {courseCounts[courseName]}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.contentSection}>
        <View style={styles.sectionTitleRow}>
          <View>
            <Text style={styles.eyebrow}>RECENT ADDITIONS</Text>
            <Text style={styles.sectionTitle}>Your latest dishes</Text>
          </View>

          <Pressable onPress={() => setActiveScreen('Menu')}>
            <Text style={styles.textLink}>View all</Text>
          </Pressable>
        </View>

        {menuItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>✦</Text>
            <Text style={styles.emptyTitle}>
              Your menu is ready to take shape
            </Text>
            <Text style={styles.emptyDescription}>
              Add your first dish to start building your restaurant menu.
            </Text>
            <Pressable
              style={styles.primaryButton}
              onPress={openNewItemForm}
            >
              <Text style={styles.primaryButtonText}>
                Add your first dish
              </Text>
            </Pressable>
          </View>
        ) : (
          menuItems.slice(0, 3).map(renderMenuCard)
        )}
      </View>
    </View>
  );

  // Full menu screen.
  const renderMenu = () => (
    <View>
      <SectionHeading
        eyebrow="DISH LIBRARY"
        title="Your menu"
        subtitle="Manage every dish available at your restaurant."
      />

      <View style={styles.menuToolbar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search dishes by name..."
          placeholderTextColor={COLORS.muted}
          value={searchText}
          onChangeText={setSearchText}
        />

        <Text style={styles.filterLabel}>FILTER BY COURSE</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {['All', ...COURSES].map((filter) => (
            <Pressable
              key={filter}
              onPress={() => setSelectedFilter(filter)}
              style={[
                styles.filterChip,
                selectedFilter === filter && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === filter && styles.filterChipTextActive,
                ]}
              >
                {filter}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.resultsRow}>
          <Text style={styles.resultsText}>
            Showing {filteredItems.length} of {totalItems} dishes
          </Text>
          <Pressable onPress={clearSearch}>
            <Text style={styles.textLink}>Clear filters</Text>
          </Pressable>
        </View>
      </View>

      {filteredItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>⌕</Text>
          <Text style={styles.emptyTitle}>
            {totalItems === 0
              ? 'No dishes added yet'
              : 'No matching dishes'}
          </Text>
          <Text style={styles.emptyDescription}>
            {totalItems === 0
              ? 'Create your first dish to get started.'
              : 'Try a different search or clear your filters.'}
          </Text>

          {totalItems === 0 ? (
            <Pressable
              style={styles.primaryButton}
              onPress={openNewItemForm}
            >
              <Text style={styles.primaryButtonText}>
                Create a dish
              </Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.secondaryAction}
              onPress={clearSearch}
            >
              <Text style={styles.secondaryActionText}>
                Clear search and filters
              </Text>
            </Pressable>
          )}
        </View>
      ) : (
        filteredItems.map(renderMenuCard)
      )}
    </View>
  );

  // Add and edit form screen.
  const renderEditor = () => (
    <View>
      <SectionHeading
        eyebrow="MENU EDITOR"
        title={editingItemId ? 'Edit a dish' : 'Create a dish'}
        subtitle={
          editingItemId
            ? 'Update the details of this menu item.'
            : 'Add a new dish to your restaurant menu.'
        }
      />

      <View style={styles.editorCard}>
        <View style={styles.editorIntro}>
          <Text style={styles.editorIntroTitle}>
            Dish information
          </Text>
          <Text style={styles.editorIntroText}>
            Fields marked with * are required.
          </Text>
        </View>

        {feedback ? (
          <View
            style={[
              styles.feedbackBox,
              feedback.type === 'error'
                ? styles.feedbackError
                : styles.feedbackSuccess,
            ]}
          >
            <Text
              style={[
                styles.feedbackText,
                feedback.type === 'error'
                  ? styles.feedbackErrorText
                  : styles.feedbackSuccessText,
              ]}
            >
              {feedback.message}
            </Text>
          </View>
        ) : null}

        <Text style={styles.inputLabel}>DISH NAME *</Text>
        <TextInput
          style={styles.formInput}
          placeholder="e.g. Pan-seared salmon"
          placeholderTextColor={COLORS.muted}
          value={dishName}
          onChangeText={setDishName}
        />

        <Text style={styles.inputLabel}>DESCRIPTION *</Text>
        <TextInput
          style={[styles.formInput, styles.descriptionInput]}
          placeholder="Describe the dish, ingredients and preparation..."
          placeholderTextColor={COLORS.muted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={styles.inputLabel}>COURSE *</Text>
        <View style={styles.courseSelectList}>
          {COURSES.map((courseName) => (
            <Pressable
              key={courseName}
              onPress={() => setCourse(courseName)}
              style={[
                styles.courseSelectOption,
                course === courseName && styles.courseSelectActive,
              ]}
            >
              <View style={styles.courseSelectTextArea}>
                <Text
                  style={[
                    styles.courseSelectName,
                    course === courseName && styles.courseSelectNameActive,
                  ]}
                >
                  {courseName}
                </Text>
                <Text style={styles.courseSelectHint}>
                  {courseName === 'Starter'
                    ? 'Small plates and appetisers'
                    : courseName === 'Main Course'
                      ? 'Signature and main dishes'
                      : 'Sweet finishes and treats'}
                </Text>
              </View>

              <View
                style={[
                  styles.radioOuter,
                  course === courseName && styles.radioOuterActive,
                ]}
              >
                {course === courseName ? (
                  <View style={styles.radioInner} />
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>

        <Text style={styles.inputLabel}>PRICE (ZAR) *</Text>
        <View style={styles.priceInputWrap}>
          <Text style={styles.currencyPrefix}>R</Text>
          <TextInput
            style={styles.priceInput}
            placeholder="0.00"
            placeholderTextColor={COLORS.muted}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.formActions}>
          <Pressable
            style={styles.primaryButton}
            onPress={saveMenuItem}
          >
            <Text style={styles.primaryButtonText}>
              {editingItemId ? 'Save changes' : 'Add to menu'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.formCancelButton}
            onPress={() => {
              resetForm();
              setFeedback(null);
              setActiveScreen('Menu');
            }}
          >
            <Text style={styles.formCancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  // Insights screen.
  const renderInsights = () => (
    <View>
      <SectionHeading
        eyebrow="MENU PERFORMANCE"
        title="Menu insights"
        subtitle="Understand the size and pricing of your menu."
      />

      <View style={styles.statsGrid}>
        <StatCard
          symbol="▤"
          label="Total dishes"
          value={totalItems}
          detail="Across all courses"
        />
        <StatCard
          symbol="R"
          label="Average price"
          value={formatPrice(averagePrice)}
          detail="Average dish price"
        />
      </View>

      <View style={styles.insightPanel}>
        <Text style={styles.insightPanelTitle}>
          Course breakdown
        </Text>
        <Text style={styles.insightPanelSubtitle}>
          Number of dishes in each menu category.
        </Text>

        {COURSES.map((courseName) => {
          const count = courseCounts[courseName];
          const percentage = totalItems > 0
            ? (count / totalItems) * 100
            : 0;

          return (
            <View key={courseName} style={styles.breakdownItem}>
              <View style={styles.breakdownHeading}>
                <Text style={styles.breakdownName}>
                  {courseName}
                </Text>
                <Text style={styles.breakdownCount}>
                  {count} {count === 1 ? 'dish' : 'dishes'}
                </Text>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${percentage}%` },
                  ]}
                />
              </View>

              <Text style={styles.breakdownPercentage}>
                {percentage.toFixed(0)}% of your menu
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.insightNote}>
        <Text style={styles.insightNoteTitle}>
          Menu summary
        </Text>
        <Text style={styles.insightNoteText}>
          Your menu currently contains {totalItems} dishes.
          The average listed price is {formatPrice(averagePrice)}.
          You can update your menu at any time from the Menu section.
        </Text>
      </View>
    </View>
  );

  const screenContent = () => {
    switch (activeScreen) {
      case 'Menu':
        return renderMenu();
      case 'Editor':
        return renderEditor();
      case 'Insights':
        return renderInsights();
      default:
        return renderDashboard();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.forest} />

      <View style={styles.appShell}>
        {/* Brand header */}
        <View style={styles.topBar}>
          <View style={styles.brandLockup}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>C</Text>
            </View>
            <View>
              <Text style={styles.brandName}>CHEF'S</Text>
              <Text style={styles.brandCaption}>MENU MANAGER</Text>
            </View>
          </View>

          <View style={styles.topBarRight}>
            <View style={styles.statusIndicator} />
            <Text style={styles.statusText}>Workspace</Text>
          </View>
        </View>

        {/* Main navigation */}
        <View style={styles.navigation}>
          <NavigationItem
            label="Overview"
            symbol="⌂"
            active={activeScreen === 'Dashboard'}
            onPress={() => {
              setFeedback(null);
              setActiveScreen('Dashboard');
            }}
          />
          <NavigationItem
            label="Menu"
            symbol="▤"
            active={activeScreen === 'Menu'}
            onPress={() => {
              setFeedback(null);
              setActiveScreen('Menu');
            }}
          />
          <NavigationItem
            label="Insights"
            symbol="▥"
            active={activeScreen === 'Insights'}
            onPress={() => {
              setFeedback(null);
              setActiveScreen('Insights');
            }}
          />
          <Pressable
            style={styles.navCreateButton}
            onPress={openNewItemForm}
          >
            <Text style={styles.navCreateText}>+ Add dish</Text>
          </Pressable>
        </View>

        {/* Page content */}
        <ScrollView
          style={styles.mainScroll}
          contentContainerStyle={styles.mainContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!isLoaded ? (
            <View style={styles.loadingCard}>
              <Text style={styles.loadingText}>
                Loading your menu...
              </Text>
            </View>
          ) : (
            <>
              {feedback && activeScreen !== 'Editor' ? (
                <Pressable
                  style={[
                    styles.feedbackBox,
                    feedback.type === 'error'
                      ? styles.feedbackError
                      : styles.feedbackSuccess,
                  ]}
                  onPress={() => setFeedback(null)}
                >
                  <Text
                    style={[
                      styles.feedbackText,
                      feedback.type === 'error'
                        ? styles.feedbackErrorText
                        : styles.feedbackSuccessText,
                    ]}
                  >
                    {feedback.message}
                  </Text>
                </Pressable>
              ) : null}

              {screenContent()}
            </>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerBrand}>CHEF'S MENU MANAGER</Text>
            <Text style={styles.footerText}>
              A considered approach to menu management.
            </Text>
          </View>
        </ScrollView>
      </View>

      {/* Delete confirmation dialog */}
      <Modal
        visible={Boolean(itemToDelete)}
        transparent
        animationType="fade"
        onRequestClose={() => setItemToDelete(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmDialog}>
            <Text style={styles.dialogEyebrow}>CONFIRM ACTION</Text>
            <Text style={styles.dialogTitle}>Remove this dish?</Text>
            <Text style={styles.dialogMessage}>
              {itemToDelete
                ? `“${itemToDelete.dishName}” will be removed from your menu. This action cannot be undone.`
                : ''}
            </Text>

            <View style={styles.dialogActions}>
              <Pressable
                style={styles.dialogCancel}
                onPress={() => setItemToDelete(null)}
              >
                <Text style={styles.dialogCancelText}>Keep dish</Text>
              </Pressable>

              <Pressable
                style={styles.dialogDelete}
                onPress={confirmDelete}
              >
                <Text style={styles.dialogDeleteText}>Remove dish</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },

  appShell: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },

  topBar: {
    minHeight: 76,
    backgroundColor: COLORS.forest,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  brandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  brandMark: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandMarkText: {
    color: COLORS.forest,
    fontSize: 23,
    fontWeight: '900',
  },

  brandName: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 2.5,
  },

  brandCaption: {
    color: '#C5D2C9',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 3,
  },

  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  statusIndicator: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#9CC49D',
  },

  statusText: {
    color: '#E0E8E2',
    fontSize: 11,
    fontWeight: '600',
  },

  navigation: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  navItem: {
    flex: 1,
    minHeight: 43,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 5,
  },

  navItemActive: {
    backgroundColor: COLORS.paleGreen,
  },

  navSymbol: {
    color: COLORS.muted,
    fontSize: 17,
    fontWeight: '700',
  },

  navLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '700',
  },

  navTextActive: {
    color: COLORS.forest,
  },

  navCreateButton: {
    backgroundColor: COLORS.forest,
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderRadius: 9,
    marginLeft: 3,
  },

  navCreateText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },

  mainScroll: {
    flex: 1,
  },

  mainContent: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },

  welcomeBanner: {
    backgroundColor: COLORS.forest,
    borderRadius: 19,
    padding: 24,
    minHeight: 230,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 30,
  },

  bannerTextArea: {
    flex: 1,
    zIndex: 1,
  },

  bannerEyebrow: {
    color: COLORS.gold,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 13,
  },

  bannerTitle: {
    color: COLORS.white,
    fontSize: 27,
    fontWeight: '800',
    lineHeight: 34,
    maxWidth: 430,
  },

  bannerDescription: {
    color: '#D1DDD5',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 10,
    maxWidth: 390,
  },

  bannerButton: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.gold,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 19,
  },

  bannerButtonText: {
    color: COLORS.forest,
    fontSize: 12,
    fontWeight: '900',
  },

  bannerDecoration: {
    width: 105,
    height: 105,
    borderRadius: 53,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginLeft: 8,
  },

  bannerDecorationText: {
    color: 'rgba(255,255,255,0.18)',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -3,
  },

  contentSection: {
    marginBottom: 30,
  },

  sectionHeading: {
    marginBottom: 16,
  },

  eyebrow: {
    color: '#9A8050',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 7,
  },

  pageTitle: {
    color: COLORS.ink,
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.6,
  },

  pageSubtitle: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },

  sectionTitle: {
    color: COLORS.ink,
    fontSize: 19,
    fontWeight: '800',
    marginTop: 4,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  statCard: {
    flex: 1,
    minWidth: 135,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 17,
    minHeight: 145,
  },

  statTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 17,
  },

  statSymbol: {
    color: COLORS.forest,
    fontSize: 20,
    fontWeight: '900',
  },

  statDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.gold,
  },

  statValue: {
    color: COLORS.forest,
    fontSize: 24,
    fontWeight: '900',
  },

  statLabel: {
    color: COLORS.ink,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 5,
  },

  statDetail: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 4,
  },

  courseOverview: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 17,
  },

  courseOverviewRow: {
    minHeight: 54,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EFEA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  courseOverviewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  courseMarker: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#B8A071',
  },

  courseMarkerMiddle: {
    backgroundColor: COLORS.forestLight,
  },

  courseMarkerLast: {
    backgroundColor: '#9AAB9A',
  },

  courseOverviewName: {
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: '700',
  },

  courseOverviewCount: {
    color: COLORS.forest,
    fontSize: 15,
    fontWeight: '900',
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  textLink: {
    color: COLORS.forestLight,
    fontSize: 12,
    fontWeight: '900',
  },

  menuCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 17,
    marginBottom: 12,
  },

  menuCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },

  menuCardTitleArea: {
    flex: 1,
    gap: 8,
    alignItems: 'flex-start',
  },

  menuCardName: {
    color: COLORS.ink,
    fontSize: 17,
    fontWeight: '800',
  },

  menuCardPrice: {
    color: COLORS.forest,
    fontSize: 15,
    fontWeight: '900',
  },

  courseBadge: {
    backgroundColor: COLORS.paleGreen,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  courseBadgeText: {
    color: COLORS.forest,
    fontSize: 10,
    fontWeight: '800',
  },

  menuCardDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 13,
  },

  menuCardDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginTop: 15,
    marginBottom: 12,
  },

  menuCardActions: {
    flexDirection: 'row',
    gap: 9,
  },

  secondaryAction: {
    backgroundColor: COLORS.paleGreen,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    alignItems: 'center',
  },

  secondaryActionText: {
    color: COLORS.forest,
    fontSize: 11,
    fontWeight: '900',
  },

  deleteAction: {
    backgroundColor: COLORS.paleRed,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    alignItems: 'center',
  },

  deleteActionText: {
    color: COLORS.red,
    fontSize: 11,
    fontWeight: '900',
  },

  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 25,
    alignItems: 'center',
  },

  emptyIcon: {
    color: COLORS.gold,
    fontSize: 32,
    marginBottom: 12,
  },

  emptyTitle: {
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },

  emptyDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 7,
    maxWidth: 320,
  },

  primaryButton: {
    backgroundColor: COLORS.forest,
    borderRadius: 9,
    paddingHorizontal: 18,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 18,
  },

  primaryButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
  },

  menuToolbar: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 17,
  },

  searchInput: {
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 12,
    color: COLORS.ink,
    fontSize: 13,
  },

  filterLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginTop: 17,
    marginBottom: 9,
  },

  filterRow: {
    flexDirection: 'row',
    gap: 7,
    paddingBottom: 3,
  },

  filterChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },

  filterChipActive: {
    backgroundColor: COLORS.forest,
    borderColor: COLORS.forest,
  },

  filterChipText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
  },

  filterChipTextActive: {
    color: COLORS.white,
  },

  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
  },

  resultsText: {
    color: COLORS.muted,
    fontSize: 11,
  },

  editorCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    padding: 19,
  },

  editorIntro: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 15,
    marginBottom: 7,
  },

  editorIntroTitle: {
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: '900',
  },

  editorIntroText: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 5,
  },

  inputLabel: {
    color: '#59645C',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginTop: 20,
    marginBottom: 8,
  },

  formInput: {
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 13,
    color: COLORS.ink,
    fontSize: 13,
  },

  descriptionInput: {
    minHeight: 105,
    textAlignVertical: 'top',
  },

  courseSelectList: {
    gap: 8,
  },

  courseSelectOption: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FAFAF7',
    borderRadius: 9,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  courseSelectActive: {
    borderColor: COLORS.forest,
    backgroundColor: COLORS.paleGreen,
  },

  courseSelectTextArea: {
    flex: 1,
  },

  courseSelectName: {
    color: COLORS.ink,
    fontSize: 12,
    fontWeight: '800',
  },

  courseSelectNameActive: {
    color: COLORS.forest,
  },

  courseSelectHint: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 4,
  },

  radioOuter: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#BFC5BC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  radioOuterActive: {
    borderColor: COLORS.forest,
  },

  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.forest,
  },

  priceInputWrap: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    backgroundColor: '#FAFAF7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 13,
  },

  currencyPrefix: {
    color: COLORS.forest,
    fontSize: 14,
    fontWeight: '900',
  },

  priceInput: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 13,
    color: COLORS.ink,
    fontSize: 13,
  },

  formActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 23,
  },

  formCancelButton: {
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderRadius: 9,
    backgroundColor: COLORS.cream,
  },

  formCancelText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '800',
  },

  feedbackBox: {
    padding: 13,
    borderRadius: 9,
    marginBottom: 15,
  },

  feedbackSuccess: {
    backgroundColor: COLORS.paleGreen,
  },

  feedbackError: {
    backgroundColor: COLORS.paleRed,
  },

  feedbackText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },

  feedbackSuccessText: {
    color: COLORS.forest,
  },

  feedbackErrorText: {
    color: COLORS.red,
  },

  insightPanel: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 18,
    marginTop: 20,
  },

  insightPanelTitle: {
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: '900',
  },

  insightPanelSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 5,
    marginBottom: 15,
  },

  breakdownItem: {
    marginTop: 15,
  },

  breakdownHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  breakdownName: {
    color: COLORS.ink,
    fontSize: 12,
    fontWeight: '800',
  },

  breakdownCount: {
    color: COLORS.forest,
    fontSize: 11,
    fontWeight: '900',
  },

  progressTrack: {
    height: 8,
    backgroundColor: '#ECEDE7',
    borderRadius: 5,
    overflow: 'hidden',
  },

  progressFill: {
    height: 8,
    backgroundColor: COLORS.forestLight,
    borderRadius: 5,
  },

  breakdownPercentage: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 5,
  },

  insightNote: {
    backgroundColor: COLORS.paleGreen,
    borderRadius: 13,
    padding: 17,
    marginTop: 15,
  },

  insightNoteTitle: {
    color: COLORS.forest,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 7,
  },

  insightNoteText: {
    color: '#526257',
    fontSize: 12,
    lineHeight: 19,
  },

  loadingCard: {
    padding: 30,
    alignItems: 'center',
  },

  loadingText: {
    color: COLORS.muted,
    fontSize: 13,
  },

  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 17,
    marginTop: 18,
    alignItems: 'center',
  },

  footerBrand: {
    color: COLORS.forest,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
  },

  footerText: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 5,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 34, 27, 0.58)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },

  confirmDialog: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 22,
  },

  dialogEyebrow: {
    color: '#9A8050',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.8,
  },

  dialogTitle: {
    color: COLORS.ink,
    fontSize: 21,
    fontWeight: '900',
    marginTop: 9,
  },

  dialogMessage: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 9,
  },

  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 9,
    marginTop: 22,
  },

  dialogCancel: {
    backgroundColor: COLORS.cream,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
  },

  dialogCancelText: {
    color: COLORS.ink,
    fontSize: 11,
    fontWeight: '800',
  },

  dialogDelete: {
    backgroundColor: COLORS.red,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
  },

  dialogDeleteText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900',
  },
});

/*
====================================================
REFERENCES AND LEARNING RESOURCES
====================================================

1. React (n.d.). React Hooks Documentation.
   https://react.dev/reference/react/hooks

2. React Native (n.d.). Core Components and APIs.
   https://reactnative.dev/docs/components-and-apis

3. React Native (n.d.). Introduction to React Native.
   https://reactnative.dev/docs/intro-react

4. React Native Async Storage (n.d.). Usage Documentation.
   https://github.com/react-native-async-storage/async-storage/blob/main/docs/api/usage.md

These official resources explain React hooks, React Native
components and styling, user interaction, and persistent
local storage used in this application.

====================================================
END OF REFERENCES
====================================================
*/
