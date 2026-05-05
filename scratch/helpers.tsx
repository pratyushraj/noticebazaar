const renderBudgetValue = (item: any) => {
    // Try all possible amount field names
    const exact = Number(
        item?.deal_amount ?? item?.exact_budget ?? item?.amount ??
        item?.total_amount ?? item?.budget ??
        (item?.amounts && item.amounts[0])
    );
    if (Number.isFinite(exact) && exact > 0) return `₹${exact.toLocaleString()}`;

    // Check for budget range in nested properties
    const min = Number(item?.budget_range?.min || item?.form_data?.budget_range?.min || (item?.budget_range && typeof item.budget_range === 'object' && item.budget_range.min));
    if (Number.isFinite(min) && min > 0) return `₹${min.toLocaleString()}+`;

    const barter = Number(
        item?.barter_value ??
        item?.product_value ??
        item?.form_data?.barter_value ??
        item?.form_data?.product_value ??
        item?.raw?.barter_value ??
        item?.raw?.product_value ??
        (item?.collab_type === 'barter' ? item?.deal_amount : 0)
    );

    if (Number.isFinite(barter) && barter > 0) {
        if (barter <= 1) return 'Product value TBD';
        return `₹${barter.toLocaleString('en-IN')}`;
    }

    if (item?.collab_type === 'barter' || item?.deal_type === 'barter' || !exact) {
        return 'Product value TBD';
    }

    return 'Budget TBD';
};

const parseStringList = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(String).filter(Boolean);
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [value].filter(Boolean);
        } catch {
            return [value].filter(Boolean);
        }
    }
    return [];
};

const resolveItemPackageLabel = (item: any) => {
    if (!item) return '';

    // 1. Explicitly stored label (canonical)
    const storedLabel = String(
        item.selected_package_label ||
        item.form_data?.selected_package_label ||
        item.raw?.selected_package_label ||
        item.raw?.form_data?.selected_package_label ||
        item.package_name ||
        item.raw?.package_name ||
        item.package_tier ||
        item.raw?.package_tier ||
        ''
    ).trim();
    if (storedLabel) return storedLabel;

    // 2. Detect from campaign_goal if it looks like a tier
    const rawGoal = String(item.campaign_goal || item.raw?.campaign_goal || '').trim();
    const tierKeywords = /starter|growth|collab|campaign|exchange|product|basic|standard|premium|🚀|📈|🎯|💼|⭐|🎁/i;
    if (rawGoal && tierKeywords.test(rawGoal)) return rawGoal;

    // 3. Extract from description string (legacy)
    const rawDesc = String(item.campaign_description || item.description || item.raw?.campaign_description || item.raw?.description || '');
    const packageMatch = rawDesc.match(/(?:Selected package:|\|\|Package:)\s*([🚀📈🎯💼⭐🎁]?\s*.*?)(?=\s*Collab Duration:|\n|Additional|\|\||$)/i);
    if (packageMatch) return packageMatch[1].trim();

    // 4. Fallback to campaign_goal even if not "tier-like"
    if (rawGoal) return rawGoal;

    return '';
};

const getOfferPackageLabel = (item: any) => resolveItemPackageLabel(item);

const getOfferRequirements = (item: any) =>
    parseStringList(item?.content_requirements || item?.form_data?.content_requirements || item?.raw?.content_requirements || item?.raw?.form_data?.content_requirements);

const getOfferBarterTypes = (item: any) =>
    parseStringList(item?.barter_types || item?.form_data?.barter_types || item?.raw?.barter_types || item?.raw?.form_data?.barter_types);

const getOfferAddons = (item: any) => {
    const raw = item?.selected_addons || item?.form_data?.selected_addons || item?.raw?.selected_addons || item?.raw?.form_data?.selected_addons;
    if (!Array.isArray(raw)) return [];
    return raw.map((addon: any) => {
        const label = String(addon?.label || '').trim();
        if (!label) return '';
        const price = Number(addon?.price || 0);
        return price > 0 ? `${label} (+₹${price.toLocaleString('en-IN')})` : label;
    }).filter(Boolean);
};

const parseDealDate = (value: any): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    const asString = String(value);
    const dt = new Date(asString);
    return Number.isNaN(dt.getTime()) ? null : dt;
};

const getDaysUntil = (date: Date | null) => {
    if (!date) return null;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
};

const normalizeDealStatus = (deal: any) =>
    String(deal?.status ?? deal?.raw?.status ?? '')
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, '_');

const inferCreatorRequiresPayment = (deal: any) => {
    if (typeof deal?.requires_payment === 'boolean') return Boolean(deal.requires_payment);
    const kind = String(deal?.collab_type || deal?.deal_type || deal?.raw?.collab_type || '').trim().toLowerCase();
    const amount = Number(deal?.deal_amount || deal?.exact_budget || 0);
    if (kind === 'barter') return false;
    return kind === 'paid' || kind === 'both' || kind === 'hybrid' || kind === 'paid_barter' || (kind !== 'barter' && amount > 0);
};


const resolveCreatorDealProductImage = (item: any) => {
