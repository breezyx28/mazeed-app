          {/* Sizes */}
          <FormField
            control={form.control}
            name="sizes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('sizes')}</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {(field.value || []).map((size, index) => (
                    <div key={index} className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full">
                      <span className="text-sm">{size}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded-full"
                        onClick={() => {
                          const newSizes = [...(field.value || [])];
                          newSizes.splice(index, 1);
                          field.onChange(newSizes);
                        }}
                      >
                        <Trash className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 flex-1">
                    <Input 
                      placeholder={t('enterSize')}
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.currentTarget;
                          const newSize = input.value.trim();
                          if (newSize && !field.value?.includes(newSize)) {
                            field.onChange([...(field.value || []), newSize]);
                            input.value = '';
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        const newSize = input?.value.trim();
                        if (newSize && !field.value?.includes(newSize)) {
                          field.onChange([...(field.value || []), newSize]);
                          input.value = '';
                        }
                      }}
                    >
                      {t('addSize')}
                    </Button>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Materials */}
          <FormField
            control={form.control}
            name="materials"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('materials')}</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {(field.value || []).map((material, index) => (
                    <div key={index} className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full">
                      <span className="text-sm capitalize">{material}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded-full"
                        onClick={() => {
                          const newMaterials = [...(field.value || [])];
                          newMaterials.splice(index, 1);
                          field.onChange(newMaterials);
                        }}
                      >
                        <Trash className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 flex-1">
                    <Input 
                      placeholder={t('enterMaterial')}
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.currentTarget;
                          const newMaterial = input.value.trim();
                          if (newMaterial && !field.value?.includes(newMaterial)) {
                            field.onChange([...(field.value || []), newMaterial]);
                            input.value = '';
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        const newMaterial = input?.value.trim();
                        if (newMaterial && !field.value?.includes(newMaterial)) {
                          field.onChange([...(field.value || []), newMaterial]);
                          input.value = '';
                        }
                      }}
                    >
                      {t('addMaterial')}
                    </Button>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
