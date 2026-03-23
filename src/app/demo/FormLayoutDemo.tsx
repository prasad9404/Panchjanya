"use client";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Separator } from "@/shared/components/ui/separator";
import { cn } from "@/shared/lib/utils";
import { Check, CircleCheck, ExternalLink } from "lucide-react";
import { useState } from "react";
import AdminLayout from "@/shared/components/admin/AdminLayout";

const highlights = [
  { id: 1, feature: "Used by top design teams worldwide" },
  { id: 2, feature: "Seamless integration with design tools" },
  { id: 3, feature: "Real-time collaboration features" },
];

const plans = [
  {
    name: "Creator",
    features: [
      { feature: "Up to 3 design projects" },
      { feature: "Basic collaboration tools" },
      { feature: "5GB cloud storage" },
      { feature: "Community forum support" },
    ],
    price: "$15",
    href: "#",
    isRecommended: false,
  },
  {
    name: "Team",
    features: [
      { feature: "Unlimited design projects" },
      { feature: "Advanced collaboration suite" },
      { feature: "50GB cloud storage" },
      { feature: "Priority email support" },
    ],
    price: "$49",
    href: "#",
    isRecommended: true,
  },
  {
    name: "Agency",
    features: [
      { feature: "Unlimited projects and team members" },
      { feature: "Client portal access" },
      { feature: "250GB cloud storage" },
      { feature: "White-labeling options" },
      { feature: "Dedicated account manager" },
    ],
    price: "$99",
    href: "#",
    isRecommended: false,
  },
];

export default function FormLayoutDemo() {
  return (
    <AdminLayout>
      <div className="space-y-12">
        <WorkspaceForm />
        <Separator />
        <EarlyAccessExample />
      </div>
    </AdminLayout>
  );
}

function WorkspaceForm() {
  const [selected, setSelected] = useState(plans[1]);

  return (
    <div className="py-6">
      <form className="mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
              Create new design workspace
            </h3>
            <p className="mt-1 text-sm text-gray-500 font-medium">Configure your environment and select a plan.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
              <div className="md:flex md:items-center md:space-x-4">
                <div className="md:w-1/3">
                  <Label htmlFor="organization" className="font-semibold text-slate-700 dark:text-slate-300">
                    Organization
                  </Label>
                  <Select defaultValue="1">
                    <SelectTrigger id="organization" className="mt-2 h-11 rounded-xl">
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Acme, Inc.</SelectItem>
                      <SelectItem value="2">Hero Labs</SelectItem>
                      <SelectItem value="3">Rose Holding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="mt-4 md:mt-0 md:w-2/3">
                  <Label htmlFor="workspace" className="font-semibold text-slate-700 dark:text-slate-300">
                    Workspace name
                  </Label>
                  <Input id="workspace" placeholder="My Awesome Project" className="mt-2 h-11 rounded-xl" />
                </div>
              </div>
              <div>
                <Label htmlFor="region" className="font-semibold text-slate-700 dark:text-slate-300">
                  Region
                </Label>
                <Select defaultValue="iad1">
                  <SelectTrigger id="region" className="mt-2 h-11 rounded-xl">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fra1">eu-central-1 (Frankfurt)</SelectItem>
                    <SelectItem value="iad1">us-east-1 (Washington, D.C.)</SelectItem>
                    <SelectItem value="lhr1">eu-west-2 (London)</SelectItem>
                    <SelectItem value="sfo1">us-west-1 (San Francisco)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-2 text-xs text-muted-foreground font-medium">
                  For best performance, choose a region closest to your operations.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest text-xs">
                Plan type<span className="text-red-500">*</span>
              </h4>
              <RadioGroup
                value={selected.name}
                onValueChange={(value) =>
                  setSelected(plans.find((p) => p.name === value) || plans[0])
                }
                className="grid grid-cols-1 gap-4"
              >
                {plans.map((plan) => (
                  <label
                    key={plan.name}
                    htmlFor={plan.name}
                    className={cn(
                      "relative block cursor-pointer rounded-2xl border bg-white dark:bg-gray-900 transition-all duration-300",
                      selected.name === plan.name
                        ? "border-blue-500 ring-4 ring-blue-500/10"
                        : "border-gray-100 dark:border-gray-800 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-start space-x-4 px-6 py-6 font-[Manrope]">
                      <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center">
                        <RadioGroupItem value={plan.name} id={plan.name} />
                      </div>
                      <div className="w-full">
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-extrabold text-foreground tracking-tight">
                            {plan.name}
                          </p>
                          {plan.isRecommended && (
                            <Badge variant="secondary" className="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-bold px-3">
                              recommended
                            </Badge>
                          )}
                        </div>
                        <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6">
                          {plan.features.map((f, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                              <Check className="h-4 w-4 text-blue-500" />
                              {f.feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-b-2xl border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 px-6 py-4">
                      <a href="#" className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:underline">
                        Learn more <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <div>
                        <span className="text-xl font-black text-foreground">{plan.price}</span>
                        <span className="text-sm text-muted-foreground font-bold">/mo</span>
                      </div>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
              <Card className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white border-none shadow-xl rounded-3xl overflow-hidden p-8">
                <CardContent className="p-0 space-y-6">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                    <CircleCheck className="h-8 w-8 text-blue-300" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold tracking-tight">Why choose our platform?</h4>
                    <p className="mt-3 text-sm leading-relaxed text-blue-100 font-medium opacity-80">
                      Our flexible plans are designed to scale with your team's needs. All plans include 
                      core design collaboration features with varying levels of storage and support.
                    </p>
                  </div>
                  <ul className="space-y-4 pt-2">
                    {highlights.map((item) => (
                      <li key={item.id} className="flex items-center space-x-3 text-sm font-bold">
                        <div className="w-5 h-5 rounded-full bg-blue-400/20 flex items-center justify-center shrink-0">
                          <Check className="h-3 w-3 text-blue-300" />
                        </div>
                        <span className="truncate">{item.feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Separator className="bg-white/10" />
                  <a href="#" className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-blue-300 hover:text-white transition-colors">
                    Explore enterprise <ExternalLink className="h-4 w-4" />
                  </a>
                </CardContent>
              </Card>

              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-6 rounded-2xl">
                <p className="text-xs text-amber-800 dark:text-amber-400 font-bold leading-relaxed">
                  <span className="uppercase tracking-widest block mb-1">Important</span>
                  You can change your plan at any time. Charges will be prorated to your next billing cycle.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-end gap-4 pb-20">
          <Button type="button" variant="ghost" className="rounded-xl px-10 h-12 font-bold text-slate-500">
            Cancel
          </Button>
          <Button type="submit" className="bg-blue-900 hover:bg-blue-800 text-white rounded-xl px-12 h-12 shadow-lg shadow-blue-900/20 font-bold">
            Update Workspace
          </Button>
        </div>
      </form>
    </div>
  );
}

const workspaces = [
  { id: 1, title: "Starter", description: "Up to 10,000 requests per day.", users: "Free" },
  { id: 2, title: "Premium", description: "500,000 requests per day¹", users: "$900/month²" },
  { id: 3, title: "Enterprise", description: "Based on your specific needs", users: "Custom" },
];

function EarlyAccessExample() {
  const [selectedWorkspace, setSelectedWorkspace] = useState(workspaces[0]);

  return (
    <div className="py-20 flex items-center justify-center">
      <div className="max-w-3xl w-full bg-white dark:bg-gray-900 p-12 rounded-[2.5rem] shadow-2xl shadow-indigo-500/5 border border-gray-100 dark:border-gray-800 font-[Manrope]">
        <div className="text-center mb-12">
          <h3 className="text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tighter">Apply for early access</h3>
          <p className="mt-4 text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">
            Join the elite circle of designers shaping the future of collaboration.
          </p>
        </div>
        
        <form className="space-y-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">First name *</Label>
              <Input required placeholder="Emma" className="h-12 rounded-xl bg-slate-50/50 border-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Last name</Label>
              <Input placeholder="Crown" className="h-12 rounded-xl bg-slate-50/50 border-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Work email *</Label>
              <Input required type="email" placeholder="emma@company.com" className="h-12 rounded-xl bg-slate-50/50 border-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Company</Label>
              <Input placeholder="Company, Inc." className="h-12 rounded-xl bg-slate-50/50 border-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Team Size</Label>
              <Select defaultValue="">
                <SelectTrigger className="h-12 rounded-xl bg-slate-50/50 border-none focus:ring-2 focus:ring-indigo-500/20">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-9">1-9</SelectItem>
                  <SelectItem value="10-50">10-50</SelectItem>
                  <SelectItem value="50+">50+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-6">
            <Label className="text-xs font-black uppercase tracking-widest text-indigo-600 block text-center">Select Package</Label>
            <RadioGroup
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              defaultValue="1"
              onValueChange={(v) => setSelectedWorkspace(workspaces.find(w => w.id === parseInt(v)) || workspaces[0])}
            >
              {workspaces.map((item) => (
                <label
                  key={item.id}
                  className={cn(
                    "relative flex flex-col p-6 rounded-2xl cursor-pointer transition-all duration-300 border-2",
                    selectedWorkspace.id === item.id 
                      ? "bg-indigo-50/50 border-indigo-600 ring-4 ring-indigo-500/5 shadow-lg shadow-indigo-500/10" 
                      : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-200"
                  )}
                >
                  <div className="flex justify-between items-start mb-4">
                    <RadioGroupItem value={item.id.toString()} id={`ws-${item.id}`} />
                    <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{item.users === "Free" ? "Open" : "Pro"}</span>
                  </div>
                  <p className="font-extrabold text-gray-900 dark:text-white">{item.title}</p>
                  <p className="mt-2 text-xs text-slate-500 font-medium leading-relaxed">{item.description}</p>
                  <p className="mt-auto pt-4 font-black text-slate-900 dark:text-white">{item.users}</p>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between pt-8 border-t border-gray-100 dark:border-gray-800">
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
              By applying, you agree to our <span className="underline">Early Access Terms</span>.
             </p>
             <div className="flex gap-4">
               <Button type="button" variant="outline" className="rounded-xl h-12 px-6 font-bold border-gray-200">Go back</Button>
               <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 px-10 font-black shadow-lg shadow-indigo-600/20">Apply Now</Button>
             </div>
          </div>
        </form>
      </div>
    </div>
  );
}
