import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, Truck, Store, Clock, Shield } from "lucide-react"
import Image from "next/image"

export default function PartnerPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#2B015F]/90 to-[#2B015F]/70 z-10" />
        <Image
          src="/placeholder.svg?height=600&width=1920"
          alt="Devenir partenaire Daredare"
          width={1920}
          height={600}
          className="w-full h-[400px] object-cover"
          priority
        />
        <div className="container relative z-20 py-16 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Rejoignez l'aventure Daredare</h1>
            <p className="text-xl text-white/90 mb-8">
              Devenez partenaire de notre réseau de livraison et participez à la révolution de la logistique urbaine en
              Afrique.
            </p>
            <Button className="bg-[#FBC140] text-black hover:bg-[#FBC140]/90" size="lg">
              Postuler maintenant
            </Button>
          </div>
        </div>
      </section>

      {/* Partner Types Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#2B015F] mb-4">Deux façons de devenir partenaire</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choisissez le partenariat qui correspond le mieux à vos besoins et à vos objectifs
            </p>
          </div>

          <Tabs defaultValue="livreur" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="livreur">Livreur partenaire</TabsTrigger>
              <TabsTrigger value="relais">Point relais</TabsTrigger>
            </TabsList>
            <TabsContent value="livreur">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-4">Devenez livreur partenaire</h3>
                  <p className="text-gray-600 mb-6">
                    Rejoignez notre équipe de livreurs indépendants et profitez de la flexibilité et des revenus
                    compétitifs. Vous définissez vos horaires et zones de livraison.
                  </p>
                  <ul className="space-y-4 mb-6">
                    <li className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-[#FBC140] mr-2 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Revenus attractifs</span>
                        <p className="text-gray-600">Gagnez jusqu'à 15 000 FCFA par jour selon votre disponibilité</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-[#FBC140] mr-2 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Flexibilité totale</span>
                        <p className="text-gray-600">Travaillez quand vous voulez, où vous voulez</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-[#FBC140] mr-2 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Formation et équipement</span>
                        <p className="text-gray-600">
                          Nous vous fournissons tout ce dont vous avez besoin pour réussir
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
                <div>
                  <Image
                    src="/placeholder.svg?height=400&width=600"
                    alt="Livreur Daredare"
                    width={600}
                    height={400}
                    className="rounded-lg"
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="relais">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-4">Devenez point relais</h3>
                  <p className="text-gray-600 mb-6">
                    Transformez votre commerce en point de collecte et de livraison Daredare. Augmentez votre
                    fréquentation et générez des revenus supplémentaires.
                  </p>
                  <ul className="space-y-4 mb-6">
                    <li className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-[#FBC140] mr-2 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Revenus complémentaires</span>
                        <p className="text-gray-600">Gagnez une commission sur chaque colis traité</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-[#FBC140] mr-2 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Augmentation du trafic</span>
                        <p className="text-gray-600">Attirez de nouveaux clients dans votre commerce</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-[#FBC140] mr-2 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Intégration simple</span>
                        <p className="text-gray-600">
                          Nous vous fournissons tout le matériel et la formation nécessaires
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
                <div>
                  <Image
                    src="/placeholder.svg?height=400&width=600"
                    alt="Point relais Daredare"
                    width={600}
                    height={400}
                    className="rounded-lg"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#2B015F] mb-4">Les avantages de rejoindre Daredare</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Découvrez pourquoi des centaines de partenaires nous ont déjà rejoints
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-[#FBC140] rounded-full flex items-center justify-center mb-4">
                  <Truck className="h-6 w-6 text-[#2B015F]" />
                </div>
                <h3 className="text-xl font-bold mb-2">Technologie de pointe</h3>
                <p className="text-gray-600">
                  Notre application optimise les itinéraires et facilite la gestion des livraisons.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-[#FBC140] rounded-full flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-[#2B015F]" />
                </div>
                <h3 className="text-xl font-bold mb-2">Flexibilité maximale</h3>
                <p className="text-gray-600">
                  Définissez vos propres horaires et zones de livraison selon vos disponibilités.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-[#FBC140] rounded-full flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-[#2B015F]" />
                </div>
                <h3 className="text-xl font-bold mb-2">Sécurité et assurance</h3>
                <p className="text-gray-600">
                  Tous nos partenaires bénéficient d'une assurance complète pendant leurs activités.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-[#FBC140] rounded-full flex items-center justify-center mb-4">
                  <Store className="h-6 w-6 text-[#2B015F]" />
                </div>
                <h3 className="text-xl font-bold mb-2">Support continu</h3>
                <p className="text-gray-600">
                  Notre équipe est disponible 7j/7 pour vous accompagner et répondre à vos questions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Application Form Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-[#2B015F]">Formulaire de candidature</CardTitle>
                <CardDescription>Remplissez ce formulaire pour rejoindre notre réseau de partenaires</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="partner-type">Type de partenariat</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un type de partenariat" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="livreur">Livreur partenaire</SelectItem>
                          <SelectItem value="relais">Point relais</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="first-name">Prénom</Label>
                        <Input id="first-name" placeholder="Votre prénom" />
                      </div>
                      <div>
                        <Label htmlFor="last-name">Nom</Label>
                        <Input id="last-name" placeholder="Votre nom" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="votre@email.com" />
                      </div>
                      <div>
                        <Label htmlFor="phone">Téléphone</Label>
                        <div className="relative flex">
                          <Select defaultValue="+221">
                            <SelectTrigger className="w-[80px] rounded-r-none border-r-0">
                              <SelectValue placeholder="+221" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="+1">+1</SelectItem>
                              <SelectItem value="+33">+33</SelectItem>
                              <SelectItem value="+44">+44</SelectItem>
                              <SelectItem value="+49">+49</SelectItem>
                              <SelectItem value="+212">+212</SelectItem>
                              <SelectItem value="+213">+213</SelectItem>
                              <SelectItem value="+216">+216</SelectItem>
                              <SelectItem value="+220">+220</SelectItem>
                              <SelectItem value="+221">+221</SelectItem>
                              <SelectItem value="+222">+222</SelectItem>
                              <SelectItem value="+223">+223</SelectItem>
                              <SelectItem value="+224">+224</SelectItem>
                              <SelectItem value="+225">+225</SelectItem>
                              <SelectItem value="+226">+226</SelectItem>
                              <SelectItem value="+227">+227</SelectItem>
                              <SelectItem value="+228">+228</SelectItem>
                              <SelectItem value="+229">+229</SelectItem>
                              <SelectItem value="+230">+230</SelectItem>
                              <SelectItem value="+231">+231</SelectItem>
                              <SelectItem value="+232">+232</SelectItem>
                              <SelectItem value="+233">+233</SelectItem>
                              <SelectItem value="+234">+234</SelectItem>
                              <SelectItem value="+235">+235</SelectItem>
                              <SelectItem value="+236">+236</SelectItem>
                              <SelectItem value="+237">+237</SelectItem>
                              <SelectItem value="+238">+238</SelectItem>
                              <SelectItem value="+239">+239</SelectItem>
                              <SelectItem value="+240">+240</SelectItem>
                              <SelectItem value="+241">+241</SelectItem>
                              <SelectItem value="+242">+242</SelectItem>
                              <SelectItem value="+243">+243</SelectItem>
                              <SelectItem value="+244">+244</SelectItem>
                              <SelectItem value="+245">+245</SelectItem>
                              <SelectItem value="+251">+251</SelectItem>
                              <SelectItem value="+254">+254</SelectItem>
                              <SelectItem value="+255">+255</SelectItem>
                              <SelectItem value="+256">+256</SelectItem>
                              <SelectItem value="+257">+257</SelectItem>
                              <SelectItem value="+258">+258</SelectItem>
                              <SelectItem value="+260">+260</SelectItem>
                              <SelectItem value="+261">+261</SelectItem>
                              <SelectItem value="+262">+262</SelectItem>
                              <SelectItem value="+263">+263</SelectItem>
                              <SelectItem value="+264">+264</SelectItem>
                              <SelectItem value="+265">+265</SelectItem>
                              <SelectItem value="+266">+266</SelectItem>
                              <SelectItem value="+267">+267</SelectItem>
                              <SelectItem value="+268">+268</SelectItem>
                              <SelectItem value="+269">+269</SelectItem>
                              <SelectItem value="+27">+27</SelectItem>
                              <SelectItem value="+30">+30</SelectItem>
                              <SelectItem value="+31">+31</SelectItem>
                              <SelectItem value="+32">+32</SelectItem>
                              <SelectItem value="+34">+34</SelectItem>
                              <SelectItem value="+351">+351</SelectItem>
                              <SelectItem value="+352">+352</SelectItem>
                              <SelectItem value="+353">+353</SelectItem>
                              <SelectItem value="+354">+354</SelectItem>
                              <SelectItem value="+355">+355</SelectItem>
                              <SelectItem value="+356">+356</SelectItem>
                              <SelectItem value="+357">+357</SelectItem>
                              <SelectItem value="+358">+358</SelectItem>
                              <SelectItem value="+359">+359</SelectItem>
                              <SelectItem value="+36">+36</SelectItem>
                              <SelectItem value="+370">+370</SelectItem>
                              <SelectItem value="+371">+371</SelectItem>
                              <SelectItem value="+372">+372</SelectItem>
                              <SelectItem value="+373">+373</SelectItem>
                              <SelectItem value="+374">+374</SelectItem>
                              <SelectItem value="+375">+375</SelectItem>
                              <SelectItem value="+376">+376</SelectItem>
                              <SelectItem value="+377">+377</SelectItem>
                              <SelectItem value="+378">+378</SelectItem>
                              <SelectItem value="+380">+380</SelectItem>
                              <SelectItem value="+381">+381</SelectItem>
                              <SelectItem value="+382">+382</SelectItem>
                              <SelectItem value="+385">+385</SelectItem>
                              <SelectItem value="+386">+386</SelectItem>
                              <SelectItem value="+387">+387</SelectItem>
                              <SelectItem value="+389">+389</SelectItem>
                              <SelectItem value="+39">+39</SelectItem>
                              <SelectItem value="+40">+40</SelectItem>
                              <SelectItem value="+41">+41</SelectItem>
                              <SelectItem value="+420">+420</SelectItem>
                              <SelectItem value="+421">+421</SelectItem>
                              <SelectItem value="+423">+423</SelectItem>
                              <SelectItem value="+43">+43</SelectItem>
                              <SelectItem value="+45">+45</SelectItem>
                              <SelectItem value="+46">+46</SelectItem>
                              <SelectItem value="+47">+47</SelectItem>
                              <SelectItem value="+48">+48</SelectItem>
                              <SelectItem value="+51">+51</SelectItem>
                              <SelectItem value="+52">+52</SelectItem>
                              <SelectItem value="+53">+53</SelectItem>
                              <SelectItem value="+54">+54</SelectItem>
                              <SelectItem value="+55">+55</SelectItem>
                              <SelectItem value="+56">+56</SelectItem>
                              <SelectItem value="+57">+57</SelectItem>
                              <SelectItem value="+58">+58</SelectItem>
                              <SelectItem value="+60">+60</SelectItem>
                              <SelectItem value="+61">+61</SelectItem>
                              <SelectItem value="+62">+62</SelectItem>
                              <SelectItem value="+63">+63</SelectItem>
                              <SelectItem value="+64">+64</SelectItem>
                              <SelectItem value="+65">+65</SelectItem>
                              <SelectItem value="+66">+66</SelectItem>
                              <SelectItem value="+7">+7</SelectItem>
                              <SelectItem value="+81">+81</SelectItem>
                              <SelectItem value="+82">+82</SelectItem>
                              <SelectItem value="+84">+84</SelectItem>
                              <SelectItem value="+86">+86</SelectItem>
                              <SelectItem value="+90">+90</SelectItem>
                              <SelectItem value="+91">+91</SelectItem>
                              <SelectItem value="+92">+92</SelectItem>
                              <SelectItem value="+93">+93</SelectItem>
                              <SelectItem value="+94">+94</SelectItem>
                              <SelectItem value="+95">+95</SelectItem>
                              <SelectItem value="+98">+98</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input id="phone" placeholder="XX XXX XX XX" className="rounded-l-none" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="address">Adresse</Label>
                      <Input id="address" placeholder="Votre adresse complète" />
                    </div>
                    <div>
                      <Label htmlFor="city">Ville</Label>
                      <Input id="city" placeholder="Votre ville" />
                    </div>
                    <div>
                      <Label htmlFor="experience">Expérience (pour les livreurs)</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez votre niveau d'expérience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucune expérience</SelectItem>
                          <SelectItem value="less-than-1">Moins d'un an</SelectItem>
                          <SelectItem value="1-3">1 à 3 ans</SelectItem>
                          <SelectItem value="more-than-3">Plus de 3 ans</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="vehicle">Type de véhicule (pour les livreurs)</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez votre type de véhicule" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scooter">Scooter</SelectItem>
                          <SelectItem value="moto">Moto</SelectItem>
                          <SelectItem value="car">Voiture</SelectItem>
                          <SelectItem value="bicycle">Vélo</SelectItem>
                          <SelectItem value="none">Aucun véhicule</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="business-type">Type de commerce (pour les points relais)</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez votre type de commerce" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grocery">Épicerie</SelectItem>
                          <SelectItem value="pharmacy">Pharmacie</SelectItem>
                          <SelectItem value="convenience">Supérette</SelectItem>
                          <SelectItem value="bookstore">Librairie</SelectItem>
                          <SelectItem value="other">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="message">Message (facultatif)</Label>
                      <Textarea
                        id="message"
                        placeholder="Partagez des informations supplémentaires qui pourraient être utiles"
                        rows={4}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-[#2B015F] hover:bg-[#2B015F]/90">
                    Envoyer ma candidature
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#2B015F] mb-4">Témoignages de nos partenaires</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Découvrez ce que nos partenaires disent de leur expérience avec Daredare
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <div className="mr-4">
                    <Image
                      src="/placeholder.svg?height=60&width=60"
                      alt="Photo de profil"
                      width={60}
                      height={60}
                      className="rounded-full"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold">Amadou Diallo</h3>
                    <p className="text-sm text-gray-500">Livreur partenaire depuis 2022</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  "Rejoindre Daredare a été la meilleure décision pour moi. Je gère mon emploi du temps comme je le
                  souhaite et les revenus sont très intéressants. L'application est simple à utiliser et l'équipe est
                  toujours disponible."
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <div className="mr-4">
                    <Image
                      src="/placeholder.svg?height=60&width=60"
                      alt="Photo de profil"
                      width={60}
                      height={60}
                      className="rounded-full"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold">Fatou Ndiaye</h3>
                    <p className="text-sm text-gray-500">Propriétaire d'un point relais</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  "Depuis que mon épicerie est devenue un point relais Daredare, j'ai vu une augmentation significative
                  de ma clientèle. Le système est bien organisé et les commissions sont versées régulièrement. Je
                  recommande vivement!"
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <div className="mr-4">
                    <Image
                      src="/placeholder.svg?height=60&width=60"
                      alt="Photo de profil"
                      width={60}
                      height={60}
                      className="rounded-full"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold">Ibrahim Sow</h3>
                    <p className="text-sm text-gray-500">Livreur partenaire depuis 2021</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  "La formation fournie par Daredare est excellente et l'équipement est de qualité. J'apprécie
                  particulièrement la flexibilité et le fait que je puisse choisir mes zones de livraison. C'est un
                  excellent complément de revenus."
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#2B015F] mb-4">Questions fréquentes</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Trouvez les réponses à vos questions sur le partenariat avec Daredare
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-bold mb-2">Quelles sont les conditions pour devenir livreur partenaire?</h3>
                <p className="text-gray-600">
                  Pour devenir livreur partenaire, vous devez être majeur, posséder un smartphone, avoir accès à un
                  moyen de transport (scooter, moto, vélo ou voiture) et fournir les documents administratifs requis
                  (pièce d'identité, permis de conduire si applicable).
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-bold mb-2">Comment sont calculées les rémunérations des livreurs?</h3>
                <p className="text-gray-600">
                  La rémunération est calculée en fonction de la distance parcourue, du type de livraison et des
                  éventuels bonus (heures de pointe, conditions météorologiques, etc.). Tous les paiements sont
                  effectués de manière hebdomadaire directement sur votre compte.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-bold mb-2">Quels types de commerces peuvent devenir points relais?</h3>
                <p className="text-gray-600">
                  Tous les commerces avec un espace suffisant pour stocker des colis et des horaires d'ouverture
                  réguliers peuvent postuler: épiceries, librairies, pharmacies, supérettes, etc. Nous étudions chaque
                  candidature individuellement.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-bold mb-2">Quelle formation est fournie aux partenaires?</h3>
                <p className="text-gray-600">
                  Tous nos partenaires bénéficient d'une formation complète sur notre application, les procédures de
                  livraison, la gestion des colis et le service client. Des sessions de formation continue sont
                  également proposées régulièrement.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#2B015F] text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-6">Prêt à rejoindre l'aventure Daredare?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Postulez dès maintenant et rejoignez notre réseau de partenaires en pleine expansion
          </p>
          <Button size="lg" className="bg-[#FBC140] text-black hover:bg-[#FBC140]/90">
            Postuler maintenant
          </Button>
        </div>
      </section>
    </div>
  )
}
