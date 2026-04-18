import { useState } from "react";
import { useListWardrobeItems, getListWardrobeItemsQueryKey, useCreateWardrobeItem } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

const itemSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  brand: z.string().min(1, "Brand is required"),
  category: z.string().min(1, "Category is required"),
  primary_color_hex: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Must be a valid hex color"),
  color_name: z.string().min(1, "Color name is required"),
  style_tags: z.string().min(1, "At least one style tag is required"),
  pattern: z.string().min(1, "Pattern is required"),
  image_url: z.string().url().optional().or(z.literal('')),
});

type ItemFormValues = z.infer<typeof itemSchema>;

export default function Closet() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: items, isLoading } = useListWardrobeItems(
    categoryFilter !== "all" ? { category: categoryFilter } : undefined,
    {
      query: {
        queryKey: getListWardrobeItemsQueryKey(categoryFilter !== "all" ? { category: categoryFilter } : undefined)
      }
    }
  );

  const createItemMutation = useCreateWardrobeItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListWardrobeItemsQueryKey() });
        setIsAddOpen(false);
        form.reset();
        toast({ title: "Item Added", description: "Successfully added to your closet." });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to add item.", variant: "destructive" });
      }
    }
  });

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: "",
      brand: "",
      category: "shirt",
      primary_color_hex: "#000000",
      color_name: "Black",
      style_tags: "casual",
      pattern: "solid",
      image_url: "",
    }
  });

  const onSubmit = (data: ItemFormValues) => {
    createItemMutation.mutate({
      data: {
        ...data,
        style_tags: data.style_tags.split(",").map(s => s.trim()),
        image_url: data.image_url || null
      }
    });
  };

  const filteredItems = items?.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.brand.toLowerCase().includes(search.toLowerCase()) ||
    item.style_tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Your Closet</h2>
          <p className="text-muted-foreground">Manage your wardrobe items.</p>
        </div>
        
        <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
          <SheetTrigger asChild>
            <Button className="gap-2" data-testid="btn-add-item">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Add Wardrobe Item</SheetTitle>
              <SheetDescription>
                Add a new piece to your closet. Fill in the details below.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Oxford Button Down" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Ralph Lauren" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="shirt">Shirt</SelectItem>
                              <SelectItem value="tshirt">T-Shirt</SelectItem>
                              <SelectItem value="pants">Pants</SelectItem>
                              <SelectItem value="jeans">Jeans</SelectItem>
                              <SelectItem value="shorts">Shorts</SelectItem>
                              <SelectItem value="shoes">Shoes</SelectItem>
                              <SelectItem value="jacket">Jacket</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pattern"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pattern</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select pattern" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="solid">Solid</SelectItem>
                              <SelectItem value="stripe">Stripe</SelectItem>
                              <SelectItem value="plaid">Plaid</SelectItem>
                              <SelectItem value="graphic">Graphic</SelectItem>
                              <SelectItem value="floral">Floral</SelectItem>
                              <SelectItem value="abstract">Abstract</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="color_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Navy Blue" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="primary_color_hex"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color Hex</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input type="color" className="w-12 p-1" {...field} />
                              <Input placeholder="#000000" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="style_tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Style Tags (comma separated)</FormLabel>
                        <FormControl>
                          <Input placeholder="casual, work, summer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={createItemMutation.isPending}>
                    {createItemMutation.isPending ? "Adding..." : "Save Item"}
                  </Button>
                </form>
              </Form>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search items..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-closet"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="shirt">Shirts</SelectItem>
            <SelectItem value="tshirt">T-Shirts</SelectItem>
            <SelectItem value="pants">Pants</SelectItem>
            <SelectItem value="jeans">Jeans</SelectItem>
            <SelectItem value="shorts">Shorts</SelectItem>
            <SelectItem value="shoes">Shoes</SelectItem>
            <SelectItem value="jacket">Jackets</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
        </div>
      ) : filteredItems && filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <Card key={item.id} className="overflow-hidden flex flex-col" data-testid={`wardrobe-item-${item.id}`}>
              <div className="aspect-square bg-muted/30 relative flex items-center justify-center p-6 border-b border-border/50">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="object-contain w-full h-full mix-blend-multiply dark:mix-blend-normal" />
                ) : (
                  <div 
                    className="w-24 h-24 rounded-full shadow-md"
                    style={{ backgroundColor: item.primary_color_hex }}
                  />
                )}
                <Badge className="absolute top-3 right-3 bg-background/80 backdrop-blur text-foreground hover:bg-background/90" variant="secondary">
                  {item.category}
                </Badge>
              </div>
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold leading-tight line-clamp-1" title={item.name}>{item.name}</h4>
                    <p className="text-sm text-muted-foreground">{item.brand}</p>
                  </div>
                  <div 
                    className="w-6 h-6 rounded-full border shrink-0 ml-2" 
                    style={{ backgroundColor: item.primary_color_hex }}
                    title={item.color_name}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-auto pt-4">
                  {item.style_tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                      {tag}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-muted/50">
                    {item.pattern}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-muted/30 rounded-xl border border-dashed">
          <Shirt className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-medium">No items found</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            {search || categoryFilter !== 'all' 
              ? "Try adjusting your search or filters." 
              : "Your closet is empty. Add your first item!"}
          </p>
          {(search || categoryFilter !== 'all') && (
            <Button variant="outline" onClick={() => {setSearch(''); setCategoryFilter('all');}}>
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
