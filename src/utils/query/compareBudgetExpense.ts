import prisma from "../../lib/prisma";

export const calculateBudgetComparison = async (
 budgetData: any[],
 expenseData: any[],
 showAll: boolean = true
) => {
 // Fetch all categories for complete mapping
 const allCategories = await prisma.costType.findMany({
   select: {
     id: true,
     name: true,
     parentId: true,
     order: true,
   },
 });

 // Create a properly sorted array with parents followed by their children
 const sortedCategories: any[] = [];

 // Get all parent categories (no parentId) and sort them by order
 const parents = allCategories
   .filter((cat: any) => !cat.parentId)
   .sort((a: any, b: any) => {
     const orderA = a.order ?? 0;
     const orderB = b.order ?? 0;
     return orderA - orderB;
   });

 // For each parent, add it and its children
 parents.forEach((parent: any) => {
   sortedCategories.push(parent);
   
   // Find this parent's children and sort them by order
   const children = allCategories
     .filter((cat: any) => cat.parentId === parent.id)
     .sort((a: any, b: any) => {
       const orderA = a.order ?? 0;
       const orderB = b.order ?? 0;
       return orderA - orderB;
     });
   
   // Add all children right after their parent
   if (children.length > 0) {
     sortedCategories.push(...children);
   }
 });

 // Add any orphan categories at the end
 const processedIds = new Set(sortedCategories.map(cat => cat.id));
 const orphans = allCategories.filter(cat => !processedIds.has(cat.id));
 if (orphans.length > 0) {
   sortedCategories.push(...orphans);
 }

 // Initialize categoryMap with all categories
 const categoryMap: any = {};
 sortedCategories.forEach((category: any) => {
   categoryMap[category.id] = {
     categoryName: category.name,
     budget: 0,
     expense: 0,
   };
 });

 // Add budget amounts to categories
 budgetData.forEach((item: any) => {
   if (item.categoryId && categoryMap[item.categoryId]) {
     categoryMap[item.categoryId].budget += Number(item.amount || 0);
   }
 });

 // Add expense amounts to categories
 expenseData.forEach((item: any) => {
   if (item.categoryId && categoryMap[item.categoryId]) {
     categoryMap[item.categoryId].expense += Number(item.amount || 0);
   }
 });

 // Convert to array with calculations
 const categories = sortedCategories
   .map((cat: any) => {
     const data = categoryMap[cat.id];
     const budgetAmount = data.budget;
     const expenseAmount = data.expense;
     const difference = budgetAmount - expenseAmount;
     const percentageUsed =
       budgetAmount > 0 ? Math.round((expenseAmount / budgetAmount) * 100) : 0;

     // Determine status
     let status: string;
     if (budgetAmount === 0 && expenseAmount > 0) {
       status = "No Budget";
     } else if (expenseAmount === 0) {
       status = "Not Started";
     } else if (expenseAmount > budgetAmount) {
       status = "Over Budget";
     } else if (expenseAmount === budgetAmount) {
       status = "On Budget";
     } else {
       status = "Under Budget";
     }

     return {
       categoryId: cat.id,
       categoryName: data.categoryName,
         isParent: !cat.parentId,
       budgetAmount,
       expenseAmount,
       difference,
       percentageUsed,
       status,
     };
   })
   .filter((cat: any) => {
     return showAll || cat.budgetAmount > 0 || cat.expenseAmount > 0;
   });

 // Calculate totals
 const totals = categories.reduce(
   (acc: any, cat: any) => ({
     budget: acc.budget + cat.budgetAmount,
     expense: acc.expense + cat.expenseAmount,
   }),
   { budget: 0, expense: 0 }
 );

 return {
   categories,
   totals: {
     budget: totals.budget,
     expense: totals.expense,
     difference: totals.budget - totals.expense,
     percentageUsed:
       totals.budget > 0
         ? Math.round((totals.expense / totals.budget) * 100)
         : 0,
   },
 };
};